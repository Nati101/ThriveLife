import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ToastItem = {
  id: number;
  message: string;
};

type ToastContextValue = {
  toast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string) => {
    const id = nextId++;
    setItems((prev) => [...prev.slice(-2), { id, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((row) => row.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="toast-enter pointer-events-auto rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-md"
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (message: string) => {
        if (typeof console !== "undefined") console.info(message);
      },
    };
  }
  return ctx;
}

/** Hook-friendly listener for optional route-level toasts via custom events. */
export function useToastEvent(eventName = "thrivelife:toast"): void {
  const { toast } = useToast();
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.trim()) toast(detail);
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, toast]);
}

export function emitToast(message: string): void {
  window.dispatchEvent(
    new CustomEvent("thrivelife:toast", { detail: message }),
  );
}
