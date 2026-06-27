import * as React from "react";

import { normalizeIndonesianPhoneInput } from "@/lib/phone";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onValueChange, placeholder = "", ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-12 w-full items-center overflow-hidden rounded-2xl border border-white/10 bg-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          className,
        )}
      >
        <div className="flex h-full shrink-0 items-center gap-2 border-r border-white/10 bg-background/20 px-3 text-sm font-semibold text-foreground">
          <img src="/indonesia-flag.svg" alt="" aria-hidden="true" className="h-4 w-6 rounded-[3px]" />
          <span>+62</span>
        </div>
        <input
          ref={ref}
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(event) => onValueChange(normalizeIndonesianPhoneInput(event.target.value))}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          {...props}
        />
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
