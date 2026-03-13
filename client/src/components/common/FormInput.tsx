

import React, { forwardRef } from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold tracking-widest uppercase text-neutral-500 dark:text-neutral-400"
        >
          {label}
        </label>

        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-xl border bg-white dark:bg-neutral-800/60
              px-4 py-3 text-sm text-neutral-900 dark:text-white
              placeholder:text-neutral-400 dark:placeholder:text-neutral-500
              outline-none transition-all duration-200
              focus:ring-2 focus:ring-offset-0
              ${icon ? "pl-10" : ""}
              ${
                error
                  ? "border-rose-400 dark:border-rose-500 focus:ring-rose-400/30"
                  : "border-neutral-200 dark:border-neutral-700 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-indigo-400/20 dark:focus:ring-indigo-500/20"
              }
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;