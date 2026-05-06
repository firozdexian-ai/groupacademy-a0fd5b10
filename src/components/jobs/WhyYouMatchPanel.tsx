import { Link } from "react-router-dom";
import { ShieldCheck, TrendingDown, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerifiedMatch {
  mastery_score?: number;
  matched_count?: number;
  total_required?: number;
  mastery_topics?: Array<{ tag: string; mastery: number }>;
  gap_topics?: Array<{ tag: string; mastery: number }>;
  verified_credentials?: Array<{ topic_tag: string; level: string; verify_code?: string }>;
}

interface WhyYouMatchPanelProps {
  verifiedMatch?: VerifiedMatch | null;
}

export function WhyYouMatchPanel({ verifiedMatch }: WhyYouMatchPanelProps) {
  if (!verifiedMatch) return null;
  const credentials = verifiedMatch.verified_credentials || [];
  const masteryTopics = verifiedMatch.mastery_topics || [];
  const gaps = verifiedMatch.gap_topics || [];

  if (credentials.length === 0 && masteryTopics.length === 0 && gaps.length === 0) return null;

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-semibold">Why you match</h3>
          {typeof verifiedMatch.mastery_score === "number" && (
            <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-600 text-[10px]">
              {verifiedMatch.mastery_score}/100
            </Badge>
          )}
        </div>

        {credentials.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
              Verified credentials
            </p>
            <div className="flex flex-wrap gap-1.5">
              {credentials.map((c) => (
                <Badge
                  key={c.topic_tag + c.level}
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px]"
                >
                  {c.topic_tag} · {c.level}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {masteryTopics.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
              Topics you've demonstrated
            </p>
            <div className="flex flex-wrap gap-1.5">
              {masteryTopics.slice(0, 6).map((t) => (
                <Badge key={t.tag} variant="secondary" className="text-[10px]">
                  {t.tag} · {Math.round(Number(t.mastery) * 100)}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {gaps.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-amber-500" />
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
                Areas to strengthen
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {gaps.slice(0, 5).map((t) => (
                <Badge
                  key={t.tag}
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-600 text-[10px]"
                >
                  {t.tag}
                </Badge>
              ))}
            </div>
            <Link
              to="/app/talent-mirror"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline mt-1"
            >
              Practice these topics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
