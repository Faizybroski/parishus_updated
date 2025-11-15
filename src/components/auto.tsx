import React, { useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface AutoGrowTextareaProps {
  id: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  selectedFont?: string;
  required?: boolean;
  className?: string;
}

export const AutoGrowTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoGrowTextareaProps
>(
  (
    {
      id,
      placeholder = "My Event Name",
      value,
      onChange,
      selectedFont = "sans-serif",
      required = false,
      className = "",
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-grow functionality
    const handleAutoGrow = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, 40)}px`;
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleAutoGrow(e);
      onChange(e);
    };

    // Adjust height on mount and value change
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.max(
          textareaRef.current.scrollHeight,
          40
        )}px`;
      }
    }, [value]);

    return (
      <Textarea
        ref={textareaRef}
        id={id}
        placeholder={placeholder}
        value={value}
        rows={1}
        onChange={handleInputChange}
        required={required}
        className={`!leading-[1.2] p-0 resize-none overflow-hidden px-2 text-black placeholder:text-black/90 bg-transparent font-${selectedFont} border-none ring-0 focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:border-none focus:outline-none xsm:text-[2.8rem] sm:text-[4rem] md:text-[3rem] lg:text-[3.5rem] xl:text-[4rem] min-h-[2.5rem] ${className}`}
        style={{ fontFamily: selectedFont }}
      />
    );
  }
);

AutoGrowTextarea.displayName = "AutoGrowTextarea";
