import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Copy, CheckCircle2, MessageCircle, Linkedin, Facebook, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "text-indigo-600" },
  { key: "email", label: "Email", icon: Mail, color: "text-amber-600" },
] as const;

interface Props {
  job: { id: string; title: string; company_name: string; location: string | null; job_type: string | null; application_type: string; application_url: string | null; application_email: string | null };
}

export function ChannelPromotionCard({ job }: Props) {
  const [activeChannel, setActiveChannel] = useState<typeof CHANNELS[number]["key"]>("whatsapp");
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [posted, setPosted] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.from("job_channel_posts").select("channel").eq("job_id", job.id).then(({ data }) => {
      setPosted(new Set((data || []).map((d: any) => d.channel)));
    });
  }, [job.id]);

  const applyLink = job.application_type === "link" ? job.application_url
    : job.application_type === "email" ? `mailto:${job.application_email}`
    : `${window.location.origin}/jobs/${job.id}`;

  const generate = async (channel: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-share-caption", {
        body: { title: job.title, company: job.company_name, location: job.location, job_type: job.job_type, apply_link: applyLink, channel },
      });
      if (error) throw error;
      setCaptions((c) => ({ ...c, [channel]: data?.caption || "" }));
      toast.success(`${channel} caption ready`);
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const markPosted = async (channel: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("job_channel_posts").insert({
      job_id: job.id, channel, posted_by: user?.id || null, caption: captions[channel] || null,
    } as any);
    if (error) return toast.error(error.message);
    setPosted((p) => new Set(p).add(channel));
    toast.success(`Logged as posted on ${channel}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{job.title} <span className="text-muted-foreground font-normal">— {job.company_name}</span></CardTitle>
          <Badge variant="outline" className="text-xs">{posted.size}/{CHANNELS.length} channels posted</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const isPosted = posted.has(c.key);
            return (
              <Button
                key={c.key}
                size="sm"
                variant={activeChannel === c.key ? "default" : "outline"}
                className={cn("h-8", isPosted && "ring-1 ring-emerald-500/40")}
                onClick={() => setActiveChannel(c.key)}
              >
                <Icon className={cn("h-3.5 w-3.5 mr-1.5", c.color)} />
                {c.label}
                {isPosted && <CheckCircle2 className="h-3 w-3 ml-1.5 text-emerald-500" />}
              </Button>
            );
          })}
        </div>

        <div className="space-y-2">
          <Textarea
            rows={6}
            placeholder={`Generate or write a ${activeChannel} caption...`}
            value={captions[activeChannel] || ""}
            onChange={(e) => setCaptions((c) => ({ ...c, [activeChannel]: e.target.value }))}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => generate(activeChannel)} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
              AI Generate
            </Button>
            <Button size="sm" variant="outline" disabled={!captions[activeChannel]} onClick={() => {
              navigator.clipboard.writeText(captions[activeChannel]);
              toast.success("Copied");
            }}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
            <Button size="sm" disabled={!captions[activeChannel] || posted.has(activeChannel)} onClick={() => markPosted(activeChannel)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark posted
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
