"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "underline" | "bordered";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "bordered", type = "text", ...props }, ref) => {
    const variants = {
      underline:
        "w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-[#767676] transition-colors duration-300 outline-none focus-visible:border-white/50 focus-visible:ring-2 focus-visible:ring-white/70",
      bordered:
        "w-full bg-transparent border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-[#767676] transition-colors duration-300 outline-none focus-visible:border-white/50 focus-visible:ring-2 focus-visible:ring-white/70",
    };

    return (
      <input
        type={type}
        className={cn(variants[variant], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
