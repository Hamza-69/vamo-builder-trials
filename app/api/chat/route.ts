import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";
import { trackEventServer } from "@/lib/analytics-server";
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
const PINEAPPLES_PER_PROMPT = 1;
const CONTEXT_MESSAGE_LIMIT = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateSummary(
  messages: { role: string; content: string }[],
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content:
          "Summarise the following conversation between a startup founder and their AI co-pilot into a concise paragraph. Preserve key decisions, milestones, metrics, and any action items. Keep it under 200 words.",
      },
      {
        role: "user",
        content: messages
          .map((m) => `${m.role === "user" ? "Founder" : "Vamo"}: ${m.content}`)
          .join("\n"),
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

${existingSummary ? `Here is a summary of earlier conversation:\n${existingSummary}\n` : ""}

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
    "traction_signal": "string or null",
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

  // ── 1. Insert user message ──────────────────────────────────────────────────
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

  // ── 2. Load context: last 20 messages + any existing summary ────────────────
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(CONTEXT_MESSAGE_LIMIT + 1); // +1 to check if we need to summarise older ones

  const sortedMessages = (recentMessages ?? []).reverse();

  // Load existing summary
  const { data: existingSummary } = await supabase
    .from("chat_summaries")
    .select("summary, messages_up_to")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let summaryText = existingSummary?.summary ?? null;

  // If there are more messages than the limit, summarise the overflow
  if (sortedMessages.length > CONTEXT_MESSAGE_LIMIT) {
    const overflowMessages = sortedMessages.slice(
      0,
      sortedMessages.length - CONTEXT_MESSAGE_LIMIT,
    );

    try {
      const newSummaryPart = await generateSummary(
        overflowMessages.map((m) => ({ role: m.role, content: m.content })),
      );

      const combinedSummary = summaryText
        ? `${summaryText}\n\n${newSummaryPart}`
        : newSummaryPart;

      const lastOverflowTs =
        overflowMessages[overflowMessages.length - 1]?.created_at;

      if (lastOverflowTs) {
        await supabase.from("chat_summaries").insert({
          project_id: projectId,
          summary: combinedSummary,
          messages_up_to: lastOverflowTs,
        });
      }

      summaryText = combinedSummary;
    } catch (err) {
      console.error("[chat] Failed to generate summary:", err);
      // Non-blocking — continue with whatever summary we had
    }
  }

  // Build the messages window for OpenAI (last 20)
  const contextWindow = sortedMessages.slice(-CONTEXT_MESSAGE_LIMIT);

  // ── 3. Call OpenAI ──────────────────────────────────────────────────────────
  let aiResult: AiResponse;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system" as const,
          content: buildSystemPrompt(project, summaryText),
        },
        ...contextWindow.map((m) => ({
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

  // ── 4. Insert assistant message ─────────────────────────────────────────────
  const { data: assistantMsg, error: assistantMsgError } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      user_id: user.id,
      role: "assistant",
      content: aiResult.reply,
      extracted_intent: aiResult.intent,
      tag: tag ?? aiResult.intent,
      pineapples_earned: PINEAPPLES_PER_PROMPT,
      message_type: "success",
    })
    .select()
    .single();

  if (assistantMsgError) {
    console.error("[chat] Failed to insert assistant message:", assistantMsgError.message);
  }

  // ── 5. Insert activity event ────────────────────────────────────────────────
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
        pineapples: PINEAPPLES_PER_PROMPT,
        traction_signal: aiResult.business_update.traction_signal,
      },
    });

  if (eventError) {
    console.error("[chat] Failed to insert activity event:", eventError.message);
  }

  // ── 6. Award pineapples ─────────────────────────────────────────────────────
  try {
    // Get current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("pineapple_balance")
      .eq("id", user.id)
      .single();

    const currentBalance = profile?.pineapple_balance ?? 0;
    const newBalance = currentBalance + PINEAPPLES_PER_PROMPT;

    // Update balance
    await supabase
      .from("profiles")
      .update({ pineapple_balance: newBalance })
      .eq("id", user.id);

    // Insert ledger entry
    await supabase.from("reward_ledger").insert({
      user_id: user.id,
      project_id: projectId,
      event_type: "prompt",
      reward_amount: PINEAPPLES_PER_PROMPT,
      balance_after: newBalance,
      idempotency_key: `prompt_${userMsg.id}`,
    });
  } catch (err) {
    console.error("[chat] Failed to award pineapples:", err);
  }

  // ── 7. Update progress score if applicable ──────────────────────────────────
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

  // ── 8. Track analytics ──────────────────────────────────────────────────────
  await trackEventServer(supabase, user.id, "chat_prompt", {
    projectId,
    intent: aiResult.intent,
    tag: tag ?? null,
    progressDelta: aiResult.business_update.progress_delta,
    pineapples: PINEAPPLES_PER_PROMPT,
  }, projectId);

  // ── 9. Return response ─────────────────────────────────────────────────────
  return NextResponse.json({
    userMessage: userMsg,
    assistantMessage: assistantMsg ?? null,
    intent: aiResult.intent,
    pineapples_earned: PINEAPPLES_PER_PROMPT,
    business_update: aiResult.business_update,
  });
}
