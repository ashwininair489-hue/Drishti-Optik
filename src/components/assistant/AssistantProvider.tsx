import { AssistantContext, type AssistantApi } from "@/components/assistant/assistant-context";
import { AssistantLauncher, DrishtiAssistant } from "@/components/assistant/DrishtiAssistant";
import { useCallback, useMemo, useState, type ReactNode } from "react";

/**
 * Owns the assistant's open state so any page can launch it, and keeps the panel
 * mounted above the router so conversations survive navigation.
 */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const open = useCallback((prompt?: string) => {
    setPendingPrompt(prompt ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPendingPrompt(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((value) => !value);
    // A launcher click always starts a fresh, empty composer.
    setPendingPrompt(null);
  }, []);

  const value = useMemo<AssistantApi>(
    () => ({ isOpen, open, close, toggle, pendingPrompt }),
    [isOpen, open, close, toggle, pendingPrompt],
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantLauncher />
      <DrishtiAssistant />
    </AssistantContext.Provider>
  );
}
