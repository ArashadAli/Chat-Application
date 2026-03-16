import type { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  icon?: React.ReactNode;
}

export default function FormInput({
  label,
  registration,
  error,
  icon,
  id,
  ...props
}: FormInputProps) {
  const inputId = id ?? registration.name;

  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={inputId}
        className="text-xs font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400"
      >
        {label}
      </Label>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none z-10">
            {icon}
          </span>
        )}

        <Input
          id={inputId}
          {...registration}
          {...props}
          className={`
            ${icon ? "pl-10" : ""}
            rounded-xl border bg-white dark:bg-neutral-800/60
            text-neutral-900 dark:text-white
            placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            focus-visible:ring-2 focus-visible:ring-offset-0
            transition-all duration-200
            ${
              error
                ? "border-rose-400 dark:border-rose-500 focus-visible:ring-rose-400/30"
                : "border-neutral-200 dark:border-neutral-700 focus-visible:ring-sky-400/25 focus-visible:border-sky-400 dark:focus-visible:border-sky-500"
            }
          `}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-500 dark:text-rose-400">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}