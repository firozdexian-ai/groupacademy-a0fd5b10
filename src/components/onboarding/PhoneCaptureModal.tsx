import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PhoneCaptureStep } from "./PhoneCaptureStep";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onComplete: () => void;
}

/**
 * Uncloseable modal that gates the app until a phone number is captured.
 * Used for OAuth users (and any talent missing a phone) per the mandatory
 * global phone capture rule.
 */
export function PhoneCaptureModal({ open, onComplete }: Props) {
  const block = (e: Event) => e.preventDefault();
  return (
    <Dialog open={open}>
      <DialogPortal>
        <DialogOverlay className="bg-slate-950/80 backdrop-blur-xl transition-all duration-300 z-40" />
        <DialogPrimitive.Content
          onPointerDownOutside={block}
          onEscapeKeyDown={block}
          onInteractOutside={block}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background p-4 outline-none overflow-y-auto",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 duration-300",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Add your phone number</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            We need your phone number to send you job alerts and verification codes.
          </DialogPrimitive.Description>
          <div className="w-full max-w-md">
            <PhoneCaptureStep onContinue={onComplete} />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
