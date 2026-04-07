import { ReactNode } from "react";
import { clsx } from "clsx";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
    >
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 text-muted mb-5">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
