import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Bot } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface AgentAvatarProps {
  name: string;
  avatarUrl?: string | null;
  icon?: LucideIcon;
  bgColor?: string;
  iconColor?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  isCompanyAgent?: boolean;
  companyName?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

const statusSizeClasses = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

export function AgentAvatar({
  name = "Agent",
  avatarUrl,
  icon: Icon,
  bgColor,
  iconColor,
  size = "md",
  isOnline = false,
  isCompanyAgent = false,
  companyName,
  className,
}: AgentAvatarProps) {
  // CTO Fix: Safe initials logic to prevent crash on malformed names
  const initials = (name || "AI")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative flex-shrink-0", className)} aria-label={name}>
      <Avatar className={cn(sizeClasses[size], "ring-2 ring-background shadow-md border-border/10")}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
        <AvatarFallback
          className="font-black"
          style={{
            backgroundColor: bgColor || "hsl(var(--primary) / 0.1)",
            color: iconColor || "hsl(var(--primary))",
          }}
        >
          {Icon ? (
            <Icon className={cn(iconSizeClasses[size])} />
          ) : avatarUrl ? (
            // If image fails but no icon provided, show generic Bot icon instead of initials
            <Bot className={cn(iconSizeClasses[size])} />
          ) : (
            <span className={cn(size === "xl" ? "text-lg" : "text-xs")}>{initials}</span>
          )}
        </AvatarFallback>
      </Avatar>

      {/* Online Status Indicator - Shifted left if Company Badge is present */}
      {isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-background z-10",
            statusSizeClasses[size],
            isCompanyAgent && "right-1",
          )}
        >
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      )}

      {/* Company Badge */}
      {isCompanyAgent && (
        <div className="absolute -bottom-1 -right-1 z-20">
          <Badge
            variant="secondary"
            className={cn(
              "p-0 flex items-center justify-center rounded-full bg-blue-600 border-2 border-background shadow-sm",
              size === "xl" ? "h-6 w-6" : "h-4 w-4",
            )}
            title={companyName ? `Official Agent of ${companyName}` : "Company Agent"}
          >
            <Building2 className={cn("text-white", size === "xl" ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
          </Badge>
        </div>
      )}
    </div>
  );
}
