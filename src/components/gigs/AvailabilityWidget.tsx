import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { toast } from "sonner";

export function AvailabilityWidget() {
  const { talent } = useTalent();
  const { data, refetch } = useQuery({
    queryKey: ["talent-availability", talent?.id],
    enabled: !!talent?.id,
    queryFn: async () => {
      const { data } = await supabase.from("talent_availability").select("*").eq("talent_id", talent!.id).maybeSingle();
      return data;
    },
  });

  const [hours, setHours] = useState(10);
  const [paused, setPaused] = useState(false);
  const [emailOn, setEmailOn] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setHours(data.weekly_capacity_hours || 10);
      setPaused(!!data.paused_until && new Date(data.paused_until) > new Date());
      setEmailOn(data.notify_via_email !== false);
    }
  }, [data]);

  const save = async () => {
    if (!talent?.id) return;
    setSaving(true);
    const payload = {
      talent_id: talent.id,
      weekly_capacity_hours: hours,
      paused_until: paused ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      notify_via_email: emailOn,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("talent_availability").upsert(payload, { onConflict: "talent_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Availability updated");
    refetch();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Gig availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="flex justify-between mb-1"><span>Weekly capacity</span><span className="text-muted-foreground">{hours}h</span></div>
          <Slider value={[hours]} onValueChange={(v) => setHours(v[0])} min={0} max={40} step={1} />
        </div>
        <div className="flex items-center justify-between"><span>Pause matches (30 days)</span><Switch checked={paused} onCheckedChange={setPaused} /></div>
        <div className="flex items-center justify-between"><span>Email digests</span><Switch checked={emailOn} onCheckedChange={setEmailOn} /></div>
        <Button size="sm" onClick={save} disabled={saving} className="w-full">{saving ? "Saving…" : "Save"}</Button>
      </CardContent>
    </Card>
  );
}
