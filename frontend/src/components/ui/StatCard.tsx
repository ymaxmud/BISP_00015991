import { ReactNode } from "react";
import { clsx } from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Trend = "up" | "down" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: Trend;
  icon?: ReactNode;
  className?: string;
}

const trendConfig: Record<Trend, { icon: typeof TrendingUp; color: string }> = {
  up: { icon: TrendingUp, color: "text-green-600" },
  down: { icon: TrendingDown, color: "text-red-500" },
  neutral: { icon: Minus, color: "text-muted" },
};

function StatCard({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  className,
}: StatCardProps) {
  const { icon: TrendIcon, color: trendColor } = trendConfig[trend];

  return (
    <div
      className={clsx(
        "bg-white rounded-xl border border-gray-100 shadow-sm p-6",
        "hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {value}
          </p>
          {change && (
            <div className={clsx("flex items-center gap-1 text-sm font-medium", trendColor)}>
              <TrendIcon size={14} />
              <span>{change}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
export { StatCard };
export type { StatCardProps };
