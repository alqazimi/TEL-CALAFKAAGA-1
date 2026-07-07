"use client";

interface RegisterStepIndicatorProps {
  step: 1 | 2;
}

export function RegisterStepIndicator({ step }: RegisterStepIndicatorProps) {
  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Step {step} of 2
      </p>
      <div className="flex gap-2">
        <div
          className={`h-1.5 flex-1 rounded-full ${
            step >= 1 ? "bg-primary" : "bg-muted"
          }`}
        />
        <div
          className={`h-1.5 flex-1 rounded-full ${
            step >= 2 ? "bg-primary" : "bg-muted"
          }`}
        />
      </div>
    </div>
  );
}
