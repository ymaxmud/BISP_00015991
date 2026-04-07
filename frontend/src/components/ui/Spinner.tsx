import { clsx } from "clsx";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-3",
};

function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={clsx(
        "rounded-full border-primary/30 border-t-primary animate-spin",
        sizeStyles[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Spinner };
export type { SpinnerProps };
