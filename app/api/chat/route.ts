import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";
import { trackEventServer } from "@/lib/analytics-server";
import { awardReward } from "@/lib/rewards";
import { aiLimiter } from "@/lib/rate-limit";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatRequestBody {
  projectId: string;
  message: string;
  tag?: "feature" | "customer" | "revenue" | "ask" | "general";
}

interface AiResponse {
  reply: string;
  intent: "feature" | "customer" | "revenue" | "ask" | "general";
  business_update: {
    progress_delta: number;
    traction_signal: string | null;
    valuation_adjustment: "up" | "down" | "none";
  };
}

const VALID_TAGS = new Set(["feature", "customer", "revenue", "ask", "general"]);
const VALID_INTENTS = new Set(["feature", "customer", "revenue", "ask", "general"]);
const CONTEXT_MESSAGE_LIMIT = 11;
const SUMMARIZATION_THRESHOLD = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateSummary(
  messages: { role: string; content: string }[],
  existingSummary: string | null,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are an expert AI summarizer for a startup founder's co-pilot.
Your task is to create a COMPREHENSIVE and DETAILED summary of the provided conversation history.
This summary will be used as the SOLE context for future AI interactions, so it must not lose any critical information.

<existing_summary>
${existingSummary || "No previous summary."}
</existing_summary>

<new_messages_to_incorporate>
The following messages are the oldest in the current history and need to be merged into the summary.
</new_messages_to_incorporate>

Guidelines:
1. **Preserve Context**: Retain all key decisions, feature requirements, user feedback details, metrics, and milestones.
2. **Action Items**: Clearly list any pending or completed action items.
3. **User Preferences**: Note any specific preferences or constraints mentioned by the founder.
4. **Technical Details**: Keep technical specifics (stack, libraries, architectural choices) if mentioned.
5. **Business Context**: track revenue, valuation, and traction signals.
6. **Conciseness**: Be dense but readable. meaningful bullet points are good.
7. **Continuity**: Ensure the summary flows logically and integrates the new messages with the existing summary.

Output ONLY the new summary text. Do not include meta-commentary.`,
      },
      {
        role: "user",
        content: messages
          .map((m) => `${m.role === "user" ? "Founder" : "Vamo"}: ${m.content}`)
          .join("\n\n"),
      },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

function buildSystemPrompt(
  project: {
    name: string;
    description: string | null;
    why_built: string | null;
    progress_score: number | null;
  },
  existingSummary: string | null,
) {
  return `You are Vamo, an AI co-pilot for startup founders. The user is building a project called "${project.name}".

Project description: ${project.description ?? "No description provided."}

Why the user built this project: ${project.why_built ?? "Not specified."}

Current progress score: ${project.progress_score ?? 0}/100

${existingSummary ? `### 🧠 Long-Term Memory (Summary of past conversation):\n${existingSummary}\n` : ""}

Your job:
1. Respond helpfully to their update or question. Keep it concise — 2-3 sentences max. Be encouraging but honest.
2. Classify the intent of their message based ONLY on its actual content. Pick the single most accurate label:
   - "feature"  → they are talking about building, shipping, or planning a product feature or technical work.
   - "customer" → they mention users, user feedback, interviews, sign-ups, waitlists, or anything user/customer related.
   - "revenue"  → they mention money, pricing, sales, MRR, payments, or monetisation.
   - "ask"      → they are asking you a question or requesting advice/help.
   - "general"  → anything that does not clearly fit the above categories.
   Do NOT default to "general" when a more specific intent clearly applies. Read the message carefully.
3. If the update implies progress (shipped something, talked to users, made revenue), generate an updated business analysis.
4. Always return your response as valid JSON with this exact structure (no markdown, no code fences):
{
  "reply": "Your response text",
  "intent": "feature|customer|revenue|ask|general",
  "business_update": {
    "progress_delta": 0,
    "traction_signal": "A concise one-line description of the traction milestone achieved (e.g. 'Shipped dark-mode feature', 'Added 12 beta users from Product Hunt', 'First paying customer — $49/mo plan'). Use null when the message does NOT describe a concrete milestone.",
    "valuation_adjustment": "up|down|none"
  }
}

Rules for progress_delta:
- 0 for questions, general chat, or no meaningful progress
- 1 for minor updates (small tweaks, planning)
- 2-3 for solid progress (feature shipped, user feedback gathered)
- 4-5 only for major milestones (first paying customer, significant revenue)
- Never go overboard. Most updates are 0-2 points.`;
}

function parseAiResponse(raw: string): AiResponse | null {
  console.log(raw);
  try {
    // Strip possible markdown code fences
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.reply !== "string" ||
      !VALID_INTENTS.has(parsed.intent)
    ) {
      return null;
    }

    return {
      reply: parsed.reply,
      intent: parsed.intent,
      business_update: {
        progress_delta: Math.min(
          5,
          Math.max(0, Number(parsed.business_update?.progress_delta) || 0),
        ),
        traction_signal: parsed.business_update?.traction_signal ?? null,
        valuation_adjustment:
          parsed.business_update?.valuation_adjustment === "up"
            ? "up"
            : parsed.business_update?.valuation_adjustment === "down"
              ? "down"
              : "none",
      },
    };
  } catch {
    return null;
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // CSRF
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const supabase = createClient();

  // Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Rate limiting ---
  const { success: rateLimitOk } = aiLimiter.check(user.id);
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  // Parse body
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, message, tag } = body;

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > 10000) {
    return NextResponse.json({ error: "message is too long" }, { status: 400 });
  }
  if (tag && !VALID_TAGS.has(tag)) {
    return NextResponse.json({ error: "invalid tag" }, { status: 400 });
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, description, why_built, progress_score, owner_id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // ── 1. Insert user message (service role) ──────────────────────────────────────────
  const { data: userMsg, error: userMsgError } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      user_id: user.id,
      role: "user",
      content: message.trim(),
      tag: tag ?? null,
      message_type: "success",
    })
    .select()
    .single();

  if (userMsgError || !userMsg) {
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 },
    );
  }

  // ── 2. Load unsummarized context ──────────────────────────────────────────────
  // Fetch latest summary to know where to start
  const { data: lastSummaryData } = await supabase
    .from("chat_summaries")
    .select("summary, messages_up_to")
    .eq("project_id", projectId)
    .order("messages_up_to", { ascending: false })
    .limit(1)
    .single();

  const messagesUpTo = lastSummaryData?.messages_up_to;
  let summaryText = lastSummaryData?.summary ?? null;

  // Build query for unsummarized messages
  let query = supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true }); // Get them in chronological order for easier slicing

  if (messagesUpTo) {
    query = query.gt("created_at", messagesUpTo);
  }

  // Fetch all unsummarized messages (including the one we just inserted)
  const { data: unsummarizedMessages, error: messagesError } = await query;

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  let finalContextMessages = unsummarizedMessages ?? [];

  // ── 3. Check for Summarization Trigger (count > 20) ───────────────────────────
  // Example: 20 previous + 1 new = 21 messages.
  // We want to keep the latest 10 + current new = 11 messages as context.
  // So we summarize the first (Total - 11) messages.
  // If count is 21, we summarize 10 messages.

  if (finalContextMessages.length > SUMMARIZATION_THRESHOLD) {
    const messagesToKeepCount = CONTEXT_MESSAGE_LIMIT; // 10 previous + 1 current user msg
    const messagesToSummarizeCount = finalContextMessages.length - messagesToKeepCount;

    if (messagesToSummarizeCount > 0) {
      const messagesToSummarize = finalContextMessages.slice(0, messagesToSummarizeCount);
      const messagesToKeep = finalContextMessages.slice(messagesToSummarizeCount);

      try {
        console.log(`[chat] Summarizing ${messagesToSummarize.length} messages...`);
        const newSummary = await generateSummary(
          messagesToSummarize.map((m) => ({ role: m.role, content: m.content })),
          summaryText,
        );

        // Save new summary
        const lastSummarizedMsg = messagesToSummarize[messagesToSummarize.length - 1];
        await supabase.from("chat_summaries").insert({
          project_id: projectId,
          summary: newSummary,
          messages_up_to: lastSummarizedMsg.created_at,
        });

        summaryText = newSummary;
        finalContextMessages = messagesToKeep;
      } catch (err) {
        console.error("[chat] Failed to generate summary:", err);
        // Continue with full context if summary fails
      }
    }
  }

  // ── 4. Call OpenAI ──────────────────────────────────────────────────────────
  let aiResult: AiResponse;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system" as const,
          content: buildSystemPrompt(project, summaryText),
        },
        ...finalContextMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";
    const parsed = parseAiResponse(rawContent);

    if (!parsed) {
      // Fallback: use raw text as reply
      aiResult = {
        reply: rawContent || "I couldn't process that right now. Your update has been saved.",
        intent: tag ?? "general",
        business_update: {
          progress_delta: 0,
          traction_signal: null,
          valuation_adjustment: "none",
        },
      };
    } else {
      aiResult = parsed;
    }
  } catch (err) {
    console.error("[chat] OpenAI error:", err);

    // Fallback on AI failure
    aiResult = {
      reply: "I couldn't process that right now. Your update has been saved.",
      intent: tag ?? "general",
      business_update: {
        progress_delta: 0,
        traction_signal: null,
        valuation_adjustment: "none",
      },
    };
  }

  // ── 5. Compute traction signal type (needed for rewards) ─────────────────────
  const tractionSignalText = aiResult.business_update.traction_signal;
  let tractionSignalType: string | null = null;

  if (tractionSignalText) {
    const intentToSignalType: Record<string, string> = {
      feature: "feature_shipped",
      customer: "customer_added",
      revenue: "revenue_logged",
    };
    tractionSignalType = intentToSignalType[aiResult.intent] ?? "feature_shipped";
  }

  // ── 6. Award pineapples (idempotent, ledger-based) ──────────────────────────
  // Computed BEFORE inserting the assistant message so it can store the real count.
  let totalPineapples = 0;

  try {
    // 6a. Prompt reward: 1 🍍
    const promptReward = await awardReward({
      supabase: supabase,
      userId: user.id,
      projectId,
      eventType: "prompt",
      idempotencyKey: `${userMsg.id}-prompt`,
    });
    if (promptReward.rewarded) totalPineapples += promptReward.amount;

    // 6b. Tag bonus: +1 🍍 when tagged with feature/customer/revenue
    const rewardableTags = new Set(["feature", "customer", "revenue", "ask"]);
    const effectiveTag = tag ?? null;
    if (effectiveTag && rewardableTags.has(effectiveTag)) {
      const tagReward = await awardReward({
        supabase: supabase,
        userId: user.id,
        projectId,
        eventType: "tag_prompt",
        idempotencyKey: `${userMsg.id}-tag_prompt`,
      });
      if (tagReward.rewarded) totalPineapples += tagReward.amount;
    }

    // 6c. Traction signal reward: feature_shipped (3), customer_added (5), revenue_logged (10)
    if (tractionSignalType && ["feature_shipped", "customer_added", "revenue_logged"].includes(tractionSignalType)) {
      const tractionReward = await awardReward({
        supabase: supabase,
        userId: user.id,
        projectId,
        eventType: tractionSignalType,
        idempotencyKey: `${userMsg.id}-${tractionSignalType}`,
      });
      if (tractionReward.rewarded) totalPineapples += tractionReward.amount;
    }
  } catch (err) {
    console.error("[chat] Failed to award pineapples:", err);
  }

  // ── 7. Insert assistant message with real pineapple count ───────────────────
  const { data: assistantMsg, error: assistantMsgError } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      user_id: user.id,
      role: "assistant",
      content: aiResult.reply,
      extracted_intent: aiResult.intent,
      tag: tag ?? aiResult.intent,
      pineapples_earned: totalPineapples,
      message_type: "success",
    })
    .select()
    .single();

  if (assistantMsgError) {
    console.error("[chat] Failed to insert assistant message:", assistantMsgError.message);
  }

  // ── 8. Insert activity event ────────────────────────────────────────────────
  const { error: eventError } = await supabase
    .from("activity_events")
    .insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "prompt",
      description: message.trim().slice(0, 200),
      metadata: {
        intent: aiResult.intent,
        tag: tag ?? null,
        traction_signal: aiResult.business_update.traction_signal,
      },
    });

  if (eventError) {
    console.error("[chat] Failed to insert activity event:", eventError.message);
  }

  // ── 8b. Insert traction signal into dedicated table + log activity event ────
  if (tractionSignalText && tractionSignalType) {
    // Insert into traction_signals table
    const { error: signalError } = await supabase
      .from("traction_signals")
      .insert({
        project_id: projectId,
        user_id: user.id,
        signal_type: tractionSignalType,
        description: tractionSignalText.slice(0, 500),
        source: "prompt",
        prompt_message_id: userMsg.id,
        metadata: { intent: aiResult.intent },
      });

    if (signalError) {
      console.error("[chat] Failed to insert traction signal:", signalError.message);
    }

    // Also log as activity event for the timeline
    const { error: tractionEventError } = await supabase
      .from("activity_events")
      .insert({
        project_id: projectId,
        user_id: user.id,
        event_type: tractionSignalType,
        description: tractionSignalText.slice(0, 200),
        metadata: {
          source: "prompt",
          prompt_message_id: userMsg.id,
        },
      });

    if (tractionEventError) {
      console.error("[chat] Failed to insert traction activity event:", tractionEventError.message);
    }
  }

  // ── 8. Update progress score if applicable ──────────────────────────────────
  if (aiResult.business_update.progress_delta > 0) {
    const currentScore = project.progress_score ?? 0;
    const newScore = Math.min(100, currentScore + aiResult.business_update.progress_delta);

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        progress_score: newScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) {
      console.error("[chat] Failed to update progress score:", updateError.message);
    }
  }

  // ── 9. Track analytics (service role) ──────────────────────────────────────────
  await trackEventServer(supabase, user.id, "chat_prompt", {
    projectId,
    intent: aiResult.intent,
    tag: tag ?? null,
    progressDelta: aiResult.business_update.progress_delta,
    pineapples: totalPineapples,
  }, projectId);

  // ── 10. Return response ─────────────────────────────────────────────────────
  return NextResponse.json({
    userMessage: userMsg,
    assistantMessage: assistantMsg ?? null,
    intent: aiResult.intent,
    pineapples_earned: totalPineapples,
    business_update: aiResult.business_update,
  });
}
