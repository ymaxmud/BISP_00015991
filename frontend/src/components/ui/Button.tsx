import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark/90 shadow-sm hover:shadow-md",
  secondary:
    "bg-secondary text-white hover:bg-secondary/90 active:bg-secondary/80 shadow-sm",
  outline:
    "border border-primary text-primary hover:bg-primary hover:text-white active:bg-primary-dark",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 shadow-sm",
  ghost: "text-muted hover:bg-gray-100 hover:text-foreground active:bg-gray-200",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-7 py-3 text-base rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className,
      disabled,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
export { Button };
export type { ButtonProps };
