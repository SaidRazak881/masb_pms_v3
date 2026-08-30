"use client";

import React from "react";

export interface ChainStep {
  id: string;
  label: string;
  date?: string | null;
  status: "completed" | "current" | "upcoming" | "error";
}

interface ChainStepperProps {
  steps: ChainStep[];
}

export const ChainStepper: React.FC<ChainStepperProps> = ({ steps }) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between w-full py-4 px-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 md:space-y-0">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                step.status === "completed"
                  ? "bg-blue-600 text-white"
                  : step.status === "current"
                  ? "bg-amber-500 text-white ring-4 ring-amber-100"
                  : step.status === "error"
                  ? "bg-rose-600 text-white ring-4 ring-rose-100 animate-pulse"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step.status === "completed" ? "✓" : idx + 1}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 truncate">{step.label}</p>
              {step.date && (
                <p className="text-[11px] text-slate-500 font-medium truncate">{step.date}</p>
              )}
            </div>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`hidden md:block h-0.5 mx-4 shrink-0 w-8 lg:w-16 transition-colors ${
                step.status === "completed" ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
