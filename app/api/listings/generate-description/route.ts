import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyCsrfToken } from "@/lib/csrf";
import { aiLimiter } from "@/lib/rate-limit";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/listings/generate-description
 * AI-generates a marketplace listing description from project data + activity.
 */
export async function POST(request: NextRequest) {
  const csrfValid = await verifyCsrfToken(request);
  if (!csrfValid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const supabase = createClient();

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

  let body: { projectId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId } = body;
  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // Load project
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("id, name, description, why_built, progress_score, url, github_url, linkedin_url, owner_id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Load activity events
  const { data: events } = await supabase
    .from("activity_events")
    .select("event_type, description, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  const activityEvents = events ?? [];

  // Load traction signals
  const { data: tractionSignals } = await supabase
    .from("traction_signals")
    .select("signal_type, description")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Load message count
  const { count: messageCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  // Build context
  const promptCount = activityEvents.filter((e) => e.event_type === "prompt").length;
  const featureCount = activityEvents.filter((e) => e.event_type === "feature_shipped").length;
  const customerCount = activityEvents.filter((e) => e.event_type === "customer_added").length;
  const revenueCount = activityEvents.filter((e) => e.event_type === "revenue_logged").length;
  const linksCount = [project.url, project.github_url, project.linkedin_url].filter(Boolean).length;

  const contextData = {
    name: project.name,
    description: project.description,
    why_built: project.why_built,
    progress_score: project.progress_score ?? 0,
    links_count: linksCount,
    has_website: !!project.url,
    has_github: !!project.github_url,
    message_count: messageCount ?? 0,
    activity_summary: {
      total_events: activityEvents.length,
      prompts: promptCount,
      features_shipped: featureCount,
      customers_added: customerCount,
      revenue_logged: revenueCount,
    },
    traction_signals: (tractionSignals ?? []).map((s) => ({
      type: s.signal_type,
      description: s.description,
    })),
    recent_activity: activityEvents.slice(0, 15).map((e) => ({
      type: e.event_type,
      description: e.description,
    })),
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are a marketplace copywriter for Vamo, a platform where founders list their micro-startups and side projects for sale.

Write a compelling, honest marketplace listing description for the project below. The description should:
- Be 3-5 short paragraphs
- Open with a concise pitch of what the project is
- Highlight key traction signals, features shipped, and progress
- Mention the founder's engagement level (prompts, linked assets)
- End with why this is an attractive acquisition opportunity
- Be professional but not overly salesy — buyers value authenticity
- Do NOT use markdown formatting, code fences, or bullet points — just plain text paragraphs

Respond with ONLY the description text, nothing else.`,
        },
        {
          role: "user",
          content: JSON.stringify(contextData, null, 2),
        },
      ],
    });

    const description = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!description) {
      return NextResponse.json(
        { error: "Failed to generate description" },
        { status: 500 },
      );
    }

    return NextResponse.json({ description });
  } catch (err) {
    console.error("[listings/generate-description] OpenAI error:", err);
    return NextResponse.json(
      { error: "Failed to generate description. Please try again." },
      { status: 500 },
    );
  }
}
