"use client";

import { useCallback, useRef, useState } from "react";
import { useCsrf } from "@/hooks/use-csrf";
import type { Database } from "@/types/supabase";

export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type ChatTag = "feature" | "customer" | "revenue" | "ask" | "general";

export interface BusinessUpdate {
  progress_delta: number;
  traction_signal: string | null;
  valuation_adjustment: "up" | "down" | "none";
}

export interface ChatResponse {
  userMessage: Message;
  assistantMessage: Message | null;
  intent: ChatTag;
  pineapples_earned: number;
  business_update: BusinessUpdate;
}

export interface MessagesPage {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

export function useChat(projectId: string) {
  const { csrfFetch } = useCsrf();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  /**
   * Load the most recent messages (no cursor = newest).
   */
  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/chat/messages?projectId=${projectId}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load messages");
      }
      const data: MessagesPage = await res.json();
      setMessages(data.messages);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  /**
   * Load older messages (prepend to top) using cursor-based pagination.
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    // Use the oldest message's created_at as the cursor
    const oldest = messages[0];
    if (!oldest?.created_at) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/chat/messages?projectId=${projectId}&before=${encodeURIComponent(oldest.created_at)}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load messages");
      }
      const data: MessagesPage = await res.json();

      // Deduplicate by id before prepending
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = data.messages.filter((m) => !existingIds.has(m.id));
        return [...newMsgs, ...prev];
      });
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, hasMore, isLoading, messages]);

  /**
   * Send a message and get the AI response.
   * Optimistic: the user message appears in the UI immediately.
   * On failure the optimistic message is removed so the input stays populated.
   */
  const sendMessage = useCallback(
    async (
      content: string,
      tag?: ChatTag,
    ): Promise<ChatResponse | null> => {
      setIsSending(true);
      setError(null);

      // ── Optimistic insert ───────────────────────────────────────────────
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMsg: Message = {
        id: optimisticId,
        project_id: projectId,
        user_id: "",
        role: "user",
        content,
        tag: tag ?? null,
        extracted_intent: null,
        pineapples_earned: null,
        message_type: "success",
        created_at: new Date().toISOString(),
      } as Message;

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const res = await csrfFetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            message: content,
            tag: tag || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to send message");
        }

        const data: ChatResponse = await res.json();

        // Replace optimistic message with the real one + append assistant reply
        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== optimisticId);
          if (data.userMessage) {
            next.push(data.userMessage);
          }
          if (data.assistantMessage) {
            // Patch with the real pineapple total from the response
            next.push({
              ...data.assistantMessage,
              pineapples_earned: data.pineapples_earned,
            });
          }
          return next;
        });

        setTotal((prev) => prev + (data.assistantMessage ? 2 : 1));

        return data;
      } catch (err) {
        // Remove the optimistic message so the user can retry
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [projectId, csrfFetch],
  );

  return {
    messages,
    isLoading,
    isSending,
    error,
    hasMore,
    total,
    loadMessages,
    loadMore,
    sendMessage,
    setMessages,
  } as const;
}
