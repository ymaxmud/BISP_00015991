import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { clsx } from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            "w-full px-4 py-2.5 rounded-lg border bg-white text-foreground text-sm",
            "placeholder:text-muted/60",
            "transition-all duration-200 resize-y min-h-[100px]",
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

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
