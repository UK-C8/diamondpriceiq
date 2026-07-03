"use client";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { HelpCircle } from "lucide-react";

export function Tooltip({ content }: { content: string }) {
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <button
            type="button"
            aria-label={`More information: ${content}`}
            className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full"
          >
            <HelpCircle className="w-3.5 h-3.5 inline" />
          </button>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="max-w-xs bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50 leading-relaxed"
            sideOffset={4}
          >
            {content}
            <RadixTooltip.Arrow className="fill-gray-900" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
