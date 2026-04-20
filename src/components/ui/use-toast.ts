import { useToast, toast } from "@/hooks/use-toast";

/**
 * Platform Logic: Signal Handshake Bridge
 * Universal entry point for triggering Protocol Signals and intercepting system events.
 * * Usage:
 * const { toast } = useToast(); // Hook-based sequence
 * toast({ title: "Sync Success", description: "Registry updated." }); // Direct trigger
 */
export { useToast, toast };
