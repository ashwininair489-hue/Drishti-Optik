import { EASE_OUT } from "@/components/common/Reveal";
import { TechBadge } from "@/components/common/Tags";
import { useAssistant } from "@/components/assistant/assistant-context";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { track } from "@/lib/analytics";
import { useLiveSimulation } from "@/lib/live-simulation";
import { cn } from "@/lib/utils";
import { useAction, useMutation } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpenText,
  CornerDownLeft,
  Loader2,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  KB_PROMPTS,
  answerFromKnowledge,
  type KnowledgeAnswer,
} from "@/shared/knowledge";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "knowledge-base";
  notice?: string;
  suggested?: string[];
}

const GREETING: Message = {
  id: 0,
  role: "assistant",
  content:
    "I'm Drishti AI, the guide for this prototype. Ask me about coarse alignment, the computer-vision pipeline, or any readout on the console. I can only discuss the Drishti-Optik simulation — not ISRO systems or real hardware.",
  source: "knowledge-base",
  suggested: KB_PROMPTS.slice(0, 3),
};

export function DrishtiAssistant() {
  const { isOpen, close, pendingPrompt } = useAssistant();
  const reduced = useReducedMotion();
  const live = useLiveSimulation();

  const askAction = useAction(api.ai.ask);
  const appendExchange = useMutation(api.aiData.appendExchange);

  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [thinking, setThinking] = useState(false);
  const [conversationId, setConversationId] = useState<Id<"aiConversations"> | null>(null);
  const seq = useRef(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || thinking) return;

    setThinking(true);
    setMessages((prev) => [
      ...prev,
      { id: seq.current++, role: "user", content: trimmed },
    ]);

    // The curated knowledge base is always computed first, so the panel can
    // answer even if the network or the model gateway is unavailable.
    const localFallback: KnowledgeAnswer = answerFromKnowledge(trimmed, live);

    try {
      const result = await askAction({
        question: trimmed,
        context: live ?? undefined,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: seq.current++,
          role: "assistant",
          content: result.reply,
          source: result.source,
          notice: "notice" in result ? (result.notice as string | undefined) : undefined,
          suggested: result.suggested,
        },
      ]);
      void appendExchange({
        conversationId: conversationId ?? undefined,
        question: trimmed,
        answer: result.reply,
        source: result.source,
      }).then((res) => {
        if (res?.conversationId) setConversationId(res.conversationId);
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: seq.current++,
          role: "assistant",
          content: localFallback.answer,
          source: "knowledge-base",
          notice:
            "The tracking service is unreachable, so Drishti AI answered from its curated knowledge base. The simulation itself keeps working locally.",
          suggested: localFallback.suggested,
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close Drishti AI"
            className="fixed inset-0 z-40 bg-[color-mix(in_oklch,var(--clay-shade)_30%,transparent)] backdrop-blur-[2px] sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          <motion.aside
            role="dialog"
            aria-modal="false"
            aria-label="Drishti AI assistant"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.32, ease: EASE_OUT }}
            className={cn(
              "clay fixed z-50 flex flex-col overflow-hidden",
              "inset-x-3 bottom-3 top-auto h-[78vh] rounded-[2rem]",
              "sm:inset-x-auto sm:right-5 sm:bottom-5 sm:top-20 sm:h-auto sm:w-[400px]",
            )}
          >
            <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
              <span className="clay-sm flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--chart-1)_22%,var(--clay-surface))] text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight text-foreground">Drishti AI</p>
                <p className="hud-label !text-[10px]">Prototype guide · simulation only</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={close}
                aria-label="Close assistant"
                className="clay-press rounded-full"
              >
                <X className="size-4" />
              </Button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
              aria-live="polite"
            >
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSuggestion={(value) => void submit(value)}
                />
              ))}
              {thinking && <ThinkingBubble />}
            </div>

            <Composer
              initialValue={pendingPrompt ?? ""}
              busy={thinking}
              onSubmit={(question) => void submit(question)}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Input row. Mounted only while the panel is open, so it can seed itself from
 * the launch prompt without an effect and re-focus on each open.
 */
function Composer({
  initialValue,
  busy,
  onSubmit,
}: {
  initialValue: string;
  busy: boolean;
  onSubmit: (question: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <form
      className="border-t border-border/60 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        onSubmit(value);
        setValue("");
      }}
    >
      <div className="clay-inset flex items-end gap-2 rounded-3xl p-2">
        <label className="sr-only" htmlFor="drishti-input">
          Ask Drishti AI a question
        </label>
        <textarea
          id="drishti-input"
          rows={1}
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!value.trim()) return;
              onSubmit(value);
              setValue("");
            }
          }}
          placeholder="Ask about coarse alignment, FSOC, tracking…"
          className="max-h-24 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={busy || value.trim().length === 0}
          aria-label="Send question"
          className="clay-press flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-45"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CornerDownLeft className="size-4" />
          )}
        </button>
      </div>
      <p className="mt-2 flex items-start gap-1.5 px-1 text-[11px] leading-4 text-muted-foreground">
        <BookOpenText className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        Responses come from the Drishti-Optik simulation knowledge base or a language model
        restricted to this prototype. No ISRO systems are connected.
      </p>
    </form>
  );
}

function MessageBubble({
  message,
  onSuggestion,
}: {
  message: Message;
  onSuggestion: (value: string) => void;
}) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("max-w-[92%]", isUser && "max-w-[85%]")}>
        <div
          className={cn(
            "rounded-3xl px-3.5 py-2.5 text-sm leading-6",
            isUser
              ? "bg-primary text-primary-foreground"
              : "clay-sm text-foreground",
          )}
        >
          {message.content}
        </div>

        {!isUser && message.source && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TechBadge tone={message.source === "ai" ? "busy" : "ok"}>
              {message.source === "ai" ? "Model answer" : "Curated answer"}
            </TechBadge>
          </div>
        )}

        {message.notice && (
          <p className="mt-2 flex items-start gap-1.5 rounded-2xl bg-[color-mix(in_oklch,var(--chart-5)_16%,transparent)] px-3 py-2 text-[11px] leading-4 text-[color-mix(in_oklch,var(--chart-5)_45%,black)]">
            <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {message.notice}
          </p>
        )}

        {!isUser && message.suggested && message.suggested.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.suggested.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestion(suggestion)}
                className="clay-press rounded-full bg-[color-mix(in_oklch,var(--chart-1)_14%,var(--clay-surface))] px-3 py-1.5 text-left text-[11px] font-medium text-foreground/85"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ThinkingBubble() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="clay-sm flex items-center gap-1.5 rounded-3xl px-4 py-3">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="size-1.5 rounded-full bg-muted-foreground"
            animate={reduced ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: index * 0.15 }}
          />
        ))}
        <span className="sr-only">Drishti AI is thinking</span>
      </div>
    </motion.div>
  );
}

/** Floating launcher shown on every page. */
export function AssistantLauncher() {
  const { isOpen, toggle } = useAssistant();
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
          transition={{ duration: reduced ? 0 : 0.3, ease: EASE_OUT }}
          className="fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6"
        >
          <button
            type="button"
            onClick={() => {
              toggle();
              track("assistant_opened");
            }}
            aria-label={isOpen ? "Close Drishti AI" : "Open Drishti AI assistant"}
            className="clay clay-hover clay-press group flex items-center gap-2.5 rounded-full py-3 pl-3.5 pr-4"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="hidden text-sm font-semibold text-foreground sm:inline">
              Drishti AI
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

