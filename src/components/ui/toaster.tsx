import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

/**
 * Platform Logic: Signal Orchestrator
 * Manages the lifecycle and spatial distribution of Protocol Signals.
 * Synchronized with the 2026 'Executive Logic' grid and depth protocols.
 */
export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            {/* Logic Metadata Container */}
            <div className="grid gap-1.5 py-1">
              {title && <ToastTitle className="text-[11px] md:text-sm">{title}</ToastTitle>}
              {description && <ToastDescription className="leading-tight">{description}</ToastDescription>}
            </div>

            {/* Action Interaction Node */}
            {action && <div className="flex shrink-0 items-center justify-center pl-4">{action}</div>}

            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
