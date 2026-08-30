"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Area,
} from "recharts";

// Helper for formatting Ringgit Malaysia (RM)
const formatRM = (val: number) => {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(val);
};

// Custom Tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl border border-slate-700">
        <p className="font-bold mb-1 text-slate-300">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} style={{ color: p.color }}>
            {p.name}: <span className="font-semibold">{formatRM(p.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Revenue vs Collection Trend Chart
export const RevenueTrendChart: React.FC<{ data: any[] }> = ({ data }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 bg-slate-50 animate-pulse rounded-lg" />;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `RM ${val >= 1000 ? `${val / 1000}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          <Bar dataKey="Invoiced" name="Invoiced Amount" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={24} />
          <Line type="monotone" dataKey="Collected" name="Cash Collected" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Waterfall Revenue Stream Chart
export const WaterfallChart: React.FC<{ data: any[] }> = ({ data }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-64 bg-slate-50 animate-pulse rounded-lg" />;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="stage" stroke="#94A3B8" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `RM ${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Amount" fill="#0F172A" radius={[4, 4, 0, 0]} barSize={32}>
            {data.map((entry, index) => {
              // Custom coloring for pipeline leakage visual representation
              const colors = ["#64748B", "#2563EB", "#D97706", "#059669"];
              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 3. R2 National Talent Impact Gauge (Bumiputera vs Non-Bumiputera split)
export const DemographicPieChart: React.FC<{ bumi: number; nonBumi: number }> = ({ bumi, nonBumi }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-44 bg-slate-50 animate-pulse rounded-full" />;

  const data = [
    { name: "Bumiputera", value: bumi, color: "#2563EB" },
    { name: "Non-Bumiputera", value: nonBumi, color: "#94A3B8" },
  ];

  const total = bumi + nonBumi;
  const bumiPercent = total > 0 ? ((bumi / total) * 100).toFixed(1) : "0";

  return (
    <div className="flex items-center justify-between h-44 w-full">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} Participants`, "Count"]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-1/2 pr-4 space-y-2 text-right">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">National Talent Impact</p>
          <p className="text-2xl font-bold text-slate-800">{total} <span className="text-xs font-medium text-slate-500">Trained</span></p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-end text-xs space-x-1.5">
            <span className="font-semibold text-slate-800">{bumi} ({bumiPercent}%)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
          </div>
          <div className="flex items-center justify-end text-xs space-x-1.5 text-slate-500">
            <span>{nonBumi} ({(100 - parseFloat(bumiPercent)).toFixed(1)}%)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Cash Conversion Speedometer (Radial Gauge Simulation using a circular CSS visual + Recharts indicator)
export const CashSpeedometer: React.FC<{ speedPercentage: number }> = ({ speedPercentage }) => {
  const rounded = Math.round(speedPercentage);
  let statusColor = "text-emerald-600";
  let statusText = "High Speed";
  if (rounded < 40) {
    statusColor = "text-rose-600";
    statusText = "Critical Lag";
  } else if (rounded < 70) {
    statusColor = "text-amber-500";
    statusText = "Moderate Flow";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* SVG Speedometer circle */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r="60"
            className="stroke-slate-100"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="72"
            cy="72"
            r="60"
            className="transition-all duration-500"
            stroke={rounded < 40 ? "#DC2626" : rounded < 70 ? "#D97706" : "#059669"}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={376.8}
            strokeDashoffset={376.8 - (376.8 * Math.min(100, Math.max(0, rounded))) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-center z-10">
          <span className="text-3xl font-extrabold text-slate-800">{rounded}%</span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Collection Rate</p>
        </div>
      </div>
      <p className={`text-xs font-bold mt-2 ${statusColor}`}>{statusText}</p>
    </div>
  );
};
