import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { verifyCsrfToken } from "@/lib/csrf";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferRequestBody {
  projectId: string;
}

interface AiOfferResponse {
  offer_low: number;
  offer_high: number;
  reasoning: string;
  signals_used: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseOfferResponse(raw: string): AiOfferResponse | null {
  try {
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.offer_low !== "number" ||
      typeof parsed.offer_high !== "number" ||
      typeof parsed.reasoning !== "string" ||
      !Array.isArray(parsed.signals_used)
    ) {
      return null;
    }

    return {
      offer_low: Math.max(0, Math.round(parsed.offer_low)),
      offer_high: Math.max(0, Math.round(parsed.offer_high)),
      reasoning: parsed.reasoning,
      signals_used: parsed.signals_used.map(String),
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
  const admin = createServiceClient();

  // Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: OfferRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId } = body;

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  // ── 1. Load project data ──
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // ── 2. Load all activity_events ──
  const { data: activityEvents } = await supabase
    .from("activity_events")
    .select("id, event_type, description, created_at, metadata")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const events = activityEvents ?? [];

  // ── 3. Load message count, traction signals, links ──
  const { count: messageCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { data: tractionSignals } = await supabase
    .from("traction_signals")
    .select("id, signal_type, description, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const linksCount = [project.url, project.github_url, project.linkedin_url].filter(
    Boolean,
  ).length;

  // Build activity summary
  const promptCount = events.filter((e) => e.event_type === "prompt").length;
  const featureCount = events.filter(
    (e) => e.event_type === "feature_shipped",
  ).length;
  const customerCount = events.filter(
    (e) => e.event_type === "customer_added",
  ).length;
  const revenueCount = events.filter(
    (e) => e.event_type === "revenue_logged",
  ).length;

  const projectDataForAi = {
    name: project.name,
    description: project.description,
    why_built: project.why_built,
    progress_score: project.progress_score ?? 0,
    links_count: linksCount,
    has_website: !!project.url,
    has_github: !!project.github_url,
    has_linkedin: !!project.linkedin_url,
    message_count: messageCount ?? 0,
    activity_summary: {
      total_events: events.length,
      prompt_count: promptCount,
      features_shipped: featureCount,
      customers_added: customerCount,
      revenue_logged: revenueCount,
    },
    traction_signals: (tractionSignals ?? []).map((s) => ({
      type: s.signal_type,
      description: s.description,
      date: s.created_at,
    })),
    recent_activity: events.slice(0, 20).map((e) => ({
      type: e.event_type,
      description: e.description,
      date: e.created_at,
    })),
  };

  // ── 4. Call OpenAI ──
  let offerResult: AiOfferResponse;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: `You are a startup valuation engine. Based on the following project data and activity, provide a non-binding offer range and explanation.

You must respond with valid JSON only (no markdown, no code fences) in this exact structure:
{
  "offer_low": <number in USD>,
  "offer_high": <number in USD>,
  "reasoning": "<string explaining the offer — 2-4 sentences>",
  "signals_used": ["<list>", "<of>", "<signals>", "<you>", "<considered>"]
}

Valuation guidelines:
- Early-stage projects with minimal activity: $50 – $500
- Projects with solid progress (features shipped, users): $500 – $5,000
- Projects with real traction (revenue, multiple signals): $5,000 – $50,000
- Be realistic and conservative. This is for micro-startups and side projects.
- Consider: progress score, number of traction signals, features shipped, customers, revenue events, project description quality, linked assets, and message count as engagement signal.
- The offer_high should typically be 1.5x to 3x the offer_low.`,
        },
        {
          role: "user",
          content: JSON.stringify(projectDataForAi, null, 2),
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";
    const parsed = parseOfferResponse(rawContent);

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to generate offer. Please try again." },
        { status: 500 },
      );
    }

    offerResult = parsed;
  } catch (err) {
    console.error("[offer] OpenAI error:", err);
    return NextResponse.json(
      { error: "Failed to generate offer. Please try again." },
      { status: 500 },
    );
  }

  // ── 5. Mark old offers as expired ──
  const { error: expireError } = await admin
    .from("offers")
    .update({ status: "expired" })
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (expireError) {
    console.error("[offer] Failed to expire old offers:", expireError.message);
  }

  // ── 6. Insert new offer ──
  const { data: offer, error: insertError } = await admin
    .from("offers")
    .insert({
      project_id: projectId,
      user_id: user.id,
      offer_low: offerResult.offer_low,
      offer_high: offerResult.offer_high,
      reasoning: offerResult.reasoning,
      signals: offerResult.signals_used,
      status: "active",
    })
    .select()
    .single();

  if (insertError || !offer) {
    console.error("[offer] Failed to insert offer:", insertError?.message);
    return NextResponse.json(
      { error: "Failed to save offer" },
      { status: 500 },
    );
  }

  // ── 7. Insert activity_event ──
  const { error: eventError } = await admin.from("activity_events").insert({
    project_id: projectId,
    user_id: user.id,
    event_type: "offer_received",
    description: `Received Vamo offer: $${offerResult.offer_low.toLocaleString()} – $${offerResult.offer_high.toLocaleString()}`,
    metadata: { offer_id: offer.id },
  });

  if (eventError) {
    console.error(
      "[offer] Failed to insert activity event:",
      eventError.message,
    );
  }

  // ── 8. Return offer ──
  return NextResponse.json({
    offer: {
      id: offer.id,
      offer_low: offer.offer_low,
      offer_high: offer.offer_high,
      reasoning: offer.reasoning,
      signals_used: offerResult.signals_used,
      status: offer.status,
      created_at: offer.created_at,
    },
  });
}
