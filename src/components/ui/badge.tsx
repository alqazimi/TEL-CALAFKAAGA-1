import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline" | "success";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        {
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300":
            variant === "default" || variant === "success",
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300":
            variant === "secondary",
          "border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300":
            variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
