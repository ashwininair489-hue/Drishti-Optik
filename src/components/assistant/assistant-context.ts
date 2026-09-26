import { createContext, useContext } from "react";

export interface AssistantApi {
  isOpen: boolean;
  /** Open the panel, optionally pre-filling a question. */
  open: (prompt?: string) => void;
  close: () => void;
  toggle: () => void;
  /** Question to pre-fill when the panel opens from a suggestion. */
  pendingPrompt: string | null;
}

export const AssistantContext = createContext<AssistantApi | null>(null);

export function useAssistant(): AssistantApi {
  const value = useContext(AssistantContext);
  if (!value) {
    throw new Error("useAssistant must be used inside <AssistantProvider>.");
  }
  return value;
}
