import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { emailNotifications } from "@/lib/emailNotifications";
import { Mail, UserPlus } from "lucide-react";

interface TalentDetailDialogProps {
  talent: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TalentDetailDialog = ({ talent, open, onOpenChange }: TalentDetailDialogProps) => {
  if (!talent) return null;

  const handlePlatformInvite = async () => {
    const toastId = toast.loading("Sending branded invite...");

    const success = await emailNotifications.talentInvite(
      talent.id,
      "Welcome to GroUp Academy! We've identified you as a top candidate and would love for you to join our platform.",
    );

    toast.dismiss(toastId);
    if (success) {
      toast.success("Invite sent from notify@groupacademy.online");
    } else {
      toast.error("Failed to send invite via platform.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {talent.full_name || "Talent Profile"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Quick Actions Section */}
          <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <Button onClick={handlePlatformInvite} className="bg-blue-600 hover:bg-blue-700 flex gap-2">
              <UserPlus className="h-4 w-4" />
              Send Platform Invite
            </Button>

            <Button variant="outline" onClick={() => window.open(`mailto:${talent.email}`)} className="flex gap-2">
              <Mail className="h-4 w-4" />
              Direct Email (Backup)
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                <p className="text-sm font-medium">{talent.email || "No email provided"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Country</h4>
                <p className="text-sm font-medium">{talent.country || "Not specified"}</p>
              </div>
            </div>

            {talent.headline && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Headline</h4>
                <p className="text-sm">{talent.headline}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
