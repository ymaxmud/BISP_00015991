import { InputHTMLAttributes, forwardRef, useId } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full px-4 py-2.5 rounded-lg border bg-white text-foreground text-sm",
            "placeholder:text-muted/60",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            error
              ? "border-danger focus:ring-danger/20 focus:border-danger"
              : "border-border hover:border-gray-300",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
            className
          )}
          {...rest}
        />
        {error && (
          <p className="mt-1.5 text-sm text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
