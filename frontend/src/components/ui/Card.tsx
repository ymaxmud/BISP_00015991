import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "bg-white rounded-xl border border-gray-100 shadow-sm",
        "hover:shadow-md transition-shadow duration-200",
        className
      )}
      {...rest}
    />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={clsx("px-6 pt-6 pb-2", className)}
      {...rest}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...rest }, ref) => (
    <h3
      ref={ref}
      className={clsx(
        "text-lg font-semibold text-foreground leading-tight",
        className
      )}
      {...rest}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={clsx("px-6 py-4", className)}
      {...rest}
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "px-6 pb-6 pt-2 flex items-center border-t border-gray-50",
        className
      )}
      {...rest}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
