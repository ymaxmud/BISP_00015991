import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              "w-full px-4 py-2.5 rounded-lg border bg-white text-foreground text-sm appearance-none",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              error
                ? "border-danger focus:ring-danger/20 focus:border-danger"
                : "border-border hover:border-gray-300",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
              className
            )}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export type { SelectProps, SelectOption };
