import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppBadgeProps {
  safetyLevel: "safe" | "moderate" | "high-risk";
  className?: string;
}

const badgeConfig = {
  safe: {
    label: "Safe",
    className: "app-badge-safe",
    variant: "default" as const,
  },
  moderate: {
    label: "Moderate",
    className: "app-badge-moderate", 
    variant: "secondary" as const,
  },
  "high-risk": {
    label: "High Risk",
    className: "app-badge-high-risk",
    variant: "destructive" as const,
  },
};

export function AppBadge({ safetyLevel, className }: AppBadgeProps) {
  const config = badgeConfig[safetyLevel];
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
