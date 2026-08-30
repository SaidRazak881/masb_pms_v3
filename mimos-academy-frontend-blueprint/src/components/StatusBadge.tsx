"use client";

import React from "react";

export type StatusType = "PAID" | "UNPAID" | "OVERDUE" | "PENDING" | "INVOICED" | "DRAFT" | "PARTIAL" | "UPCOMING" | "PENDING_DATA" | "COMPLETED";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const normStatus = (status || "DRAFT").toUpperCase();
  
  const styles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    UNPAID: "bg-amber-50 text-amber-700 border-amber-200",
    PARTIAL: "bg-blue-50 text-blue-700 border-blue-200",
    OVERDUE: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse",
    PENDING: "bg-slate-100 text-slate-700 border-slate-200",
    INVOICED: "bg-sky-50 text-sky-700 border-sky-200",
    DRAFT: "bg-gray-50 text-gray-600 border-gray-200",
    UPCOMING: "bg-indigo-50 text-indigo-700 border-indigo-200",
    PENDING_DATA: "bg-amber-50 text-amber-600 border-amber-300",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-300",
  };

  const currentStyle = styles[normStatus] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0" />
      {label || normStatus.replace("_", " ")}
    </span>
  );
};
