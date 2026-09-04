interface Step {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="hidden md:flex items-center gap-2">
      {steps.map((step, index) => {
        const status =
          step.id < currentStep ? "completed" : step.id === currentStep ? "active" : "pending";

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`step-indicator ${status}`}>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                  status === "completed"
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                    : status === "active"
                      ? "bg-brand-500/20 border-brand-500/50 text-brand-400"
                      : "bg-white/5 border-white/10 text-white/40"
                }`}
              >
                {status === "completed" ? "✓" : step.id}
              </span>
              <span className="hidden lg:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-px ${step.id < currentStep ? "bg-emerald-500/50" : "bg-white/10"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
