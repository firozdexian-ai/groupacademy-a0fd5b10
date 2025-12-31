import { AlertCircle, RefreshCw, Wifi, Clock, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ErrorType = "network" | "timeout" | "server" | "rate_limit" | "generic";

interface RetryErrorCardProps {
  type?: ErrorType;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  className?: string;
  compact?: boolean;
}

const ERROR_CONFIG: Record<ErrorType, { icon: typeof AlertCircle; title: string; description: string }> = {
  network: {
    icon: Wifi,
    title: "Connection Failed",
    description: "Please check your internet connection and try again."
  },
  timeout: {
    icon: Clock,
    title: "Request Timed Out",
    description: "The server took too long to respond. Please try again."
  },
  server: {
    icon: ServerCrash,
    title: "Server Error",
    description: "Something went wrong on our end. Please try again in a moment."
  },
  rate_limit: {
    icon: Clock,
    title: "Too Many Requests",
    description: "You've made too many requests. Please wait a moment before trying again."
  },
  generic: {
    icon: AlertCircle,
    title: "Something Went Wrong",
    description: "An unexpected error occurred. Please try again."
  }
};

export function RetryErrorCard({
  type = "generic",
  title,
  description,
  onRetry,
  retryLabel = "Try Again",
  isRetrying = false,
  className = "",
  compact = false
}: RetryErrorCardProps) {
  const config = ERROR_CONFIG[type];
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  if (compact) {
    return (
      <div className={`flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg ${className}`}>
        <div className="p-2 rounded-full bg-destructive/10">
          <Icon className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-destructive">{displayTitle}</p>
          <p className="text-sm text-muted-foreground truncate">{displayDescription}</p>
        </div>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                {retryLabel}
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`border-destructive/20 ${className}`}>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-3 rounded-full bg-destructive/10 w-fit mb-2">
          <Icon className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-lg">{displayTitle}</CardTitle>
        <CardDescription>{displayDescription}</CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent className="pt-2">
          <Button 
            onClick={onRetry}
            className="w-full"
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {retryLabel}
              </>
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// Utility to detect error type from error object
export function getErrorType(error: any): ErrorType {
  if (!error) return "generic";
  
  const message = error?.message?.toLowerCase() || "";
  const name = error?.name?.toLowerCase() || "";
  
  if (name === "aborterror" || message.includes("timeout") || message.includes("timed out")) {
    return "timeout";
  }
  
  if (message.includes("network") || message.includes("fetch") || message.includes("failed to fetch")) {
    return "network";
  }
  
  if (message.includes("rate limit") || message.includes("429") || message.includes("too many")) {
    return "rate_limit";
  }
  
  if (message.includes("500") || message.includes("server") || message.includes("internal")) {
    return "server";
  }
  
  return "generic";
}
