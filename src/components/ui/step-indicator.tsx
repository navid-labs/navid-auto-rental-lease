interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isFuture = index > currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={label} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors"
                style={{
                  backgroundColor: isFuture
                    ? "var(--chayong-surface)"
                    : "var(--chayong-primary)",
                  color: isFuture
                    ? "var(--chayong-text-caption)"
                    : "#ffffff",
                  border: isFuture
                    ? "1.5px solid var(--chayong-border)"
                    : "none",
                }}
              >
                {isCompleted ? (
                  // Checkmark for completed steps
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{
                  color: isFuture
                    ? "var(--chayong-text-caption)"
                    : isActive
                    ? "var(--chayong-primary)"
                    : "var(--chayong-text-sub)",
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {!isLast && (
              <div
                className="mb-5 h-px w-10 flex-shrink-0 transition-colors sm:w-16"
                style={{
                  backgroundColor:
                    isCompleted
                      ? "var(--chayong-primary)"
                      : "var(--chayong-border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
