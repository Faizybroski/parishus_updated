import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type InfoTooltipProps = {
  content: string;
  className?: string;
};

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className ?? "inline-flex"} style={{ cursor: "help" }}>
            <Info className="w-4 h-4 text-muted-foreground transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
