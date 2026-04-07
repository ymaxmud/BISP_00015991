import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-800",
  primary: "bg-teal-50 text-teal-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", className, children, ...rest }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center font-medium rounded-full whitespace-nowrap",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...rest}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
export { Badge };
export type { BadgeProps };
