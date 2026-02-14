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
  page: number;
  perPage: number;
  hasMore: boolean;
}

const MESSAGES_PER_PAGE = 20;

export function useChat(projectId: string) {
  const { csrfFetch } = useCsrf();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(1);
  const isInitialLoad = useRef(true);

  /**
   * Load the most recent page of messages (page 1 = newest).
   */
  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/chat/messages?projectId=${projectId}&page=1`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load messages");
      }
      const data: MessagesPage = await res.json();
      setMessages(data.messages);
      setTotal(data.total);
      setHasMore(data.hasMore);
      pageRef.current = 1;
      isInitialLoad.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  /**
   * Load older messages (prepend to top).
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await fetch(
        `/api/chat/messages?projectId=${projectId}&page=${nextPage}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load messages");
      }
      const data: MessagesPage = await res.json();
      // Prepend older messages
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setTotal(data.total);
      pageRef.current = nextPage;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, hasMore, isLoading]);

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
            next.push(data.assistantMessage);
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
