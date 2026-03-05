"use client";

import { cn } from "@/lib/utils";

interface CompanyAvatarProps {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function CompanyAvatar({
  initials,
  color,
  size = "md",
  animated = false,
  className,
}: CompanyAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };

  return (
    <div className={cn("relative", className)}>
      {animated && (
        <div
          className="absolute inset-0 rounded-xl opacity-40 animate-pulse"
          style={{ backgroundColor: color, filter: "blur(8px)" }}
        />
      )}
      <div
        className={cn(
          "relative flex items-center justify-center font-bold rounded-xl border-2 transition-all duration-200",
          sizeClasses[size]
        )}
        style={{
          backgroundColor: `${color}20`,
          borderColor: `${color}60`,
          color: color,
          clipPath:
            "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
        }}
      >
        {initials}
      </div>
    </div>
  );
}
