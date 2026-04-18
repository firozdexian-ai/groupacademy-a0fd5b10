import { useNavigate } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  path: string;
  description?: string;
  className?: string;
}

export function QuickActionCard({ icon: Icon, label, count, path, description, className }: QuickActionCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 rounded-[24px] border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden",
        "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1 active:scale-95",
        className,
      )}
      onClick={() => navigate(path)}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* Modern Icon Container */}
        <div className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0 shadow-inner">
          <Icon className="h-5 w-5" />
        </div>

        {/* Text Metadata */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-xs uppercase tracking-widest text-foreground group-hover:text-primary transition-colors truncate">
            {label}
          </p>

          {count !== undefined && count > 0 ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                {count} Active Sessions
              </p>
            </div>
          ) : description ? (
            <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5 leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>

        {/* Affordance Arrow */}
        <div className="p-1 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}
