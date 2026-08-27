import { useState, useEffect } from "react";
import {
  LayoutDashboard, AlertTriangle, TrendingUp, Filter, FileText,
  FileCheck, Receipt, CreditCard, GraduationCap, Users, UploadCloud,
  ShieldAlert, BarChart3, UserCog, Sliders, ChevronRight, Bell,
  Search, Plus, Download, RefreshCw, Eye, CheckCircle, Clock,
  XCircle, ArrowUpRight, ArrowDownRight, Building2, Calendar,
  DollarSign, Activity, Target, Zap, Menu, X, ChevronDown,
  Mail, Phone, MapPin, ExternalLink, Upload, Check, AlertCircle,
  MoreVertical, Edit, Trash2, Send, FileWarning, Globe, Flag,
  TrendingDown, Award, BookOpen, User, Layers, PieChart, List,
  ArrowLeft
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartPie, Pie, Cell, AreaChart, Area,
  FunnelChart, Funnel, LabelList, Sector, ComposedChart, Legend, Treemap
} from "recharts";

// ─── REAL DATA FROM MIMOS ACADEMY EXCEL FILES ────────────────────────────────

const KPI_DATA = {
  totalInvoiced: 397454.22,
  collected: 243568.76,
  outstanding: 153885.46,
  weightedForecast: 13052297.75,
  securedPO: 3247076.23,
  totalParticipants: 3498,
  totalSessions: 37,
  totalOpportunities: 148,
};

const MONTHLY_DATA = [
  { month: "Jan", invoiced: 17712, collected: 2000, forecast: 180000 },
  { month: "Feb", invoiced: 6167, collected: 0, forecast: 220000 },
  { month: "Mar", invoiced: 37166, collected: 82963, forecast: 310000 },
  { month: "Apr", invoiced: 80035, collected: 50100, forecast: 420000 },
  { month: "May", invoiced: 81639, collected: 62500, forecast: 580000 },
  { month: "Jun", invoiced: 40310, collected: 46606, forecast: 650000 },
  { month: "Jul", invoiced: 28000, collected: 0, forecast: 720000 },
  { month: "Aug", invoiced: 6834, collected: 0, forecast: 890000 },
];

const PIPELINE_DATA = [
  { stage: "Lead", value: 148, amount: 59300337, fill: "#94A3B8" },
  { stage: "Proposal", value: 34, amount: 12400000, fill: "#60A5FA" },
  { stage: "Negotiation", value: 6, amount: 4200000, fill: "#818CF8" },
  { stage: "PO Signed", value: 43, amount: 3247076, fill: "#34D399" },
  { stage: "Invoiced", value: 29, amount: 397454, fill: "#2563EB" },
];

const INVOICES = [
  { no: 1, company: "MINDEF", title: "TTT: Certified AI Trainer (In-House)", invoiceNo: "95000053/2026", value: 46285, sst: 3702.80, total: 49987.80, invoiceDate: "21 May 2026", paymentStatus: "UNPAID", daysOutstanding: 97, pic: "Adilah", paymentMethod: "ePerolehan", quotation: "MASB/QT/TRA/2026/0032rev2", trainingDate: "11-15 May 2026" },
  { no: 2, company: "SIRIM Academy", title: "Semiconductor Industry Overview (In-House)", invoiceNo: "95000024/2026", value: 19443.52, sst: 1555.48, total: 20999.00, invoiceDate: "6 Apr 2026", paymentStatus: "UNPAID", daysOutstanding: 142, pic: "Farrah", paymentMethod: "Self-Pay", quotation: "MASB/QT/TRA/2026/0011rev1", trainingDate: "5-6 Mar 2026" },
  { no: 3, company: "MIMOS Services Sdn Bhd", title: "Leadership & Shared Vision (In-House)", invoiceNo: "13000029/2026", value: 26800, sst: 2144, total: 28944, invoiceDate: "30 Apr 2026", paymentStatus: "UNPAID", daysOutstanding: 118, pic: "Adilah", paymentMethod: "Self-Pay", quotation: "MASB/QT/TRA/2026/0036rev2", trainingDate: "2-3 Apr 2026" },
  { no: 4, company: "Pahang Skills Dev Center", title: "AI Training for PLC Students (In-House)", invoiceNo: "95000025/2026", value: 8000, sst: 640, total: 8640, invoiceDate: "6 Apr 2026", paymentStatus: "UNPAID", daysOutstanding: 142, pic: "Adilah", paymentMethod: "Self-Pay", quotation: "MASB/QT/TRA/2026/0075", trainingDate: "10-11 Mar 2026" },
  { no: 5, company: "Interscience Sdn Bhd", title: "Space Rental - Auditorium & 5G Room", invoiceNo: "95000252/2026", value: 2300, sst: 184, total: 2484, invoiceDate: "29 Apr 2026", paymentStatus: "UNPAID", daysOutstanding: 119, pic: "Adilah", paymentMethod: "Self-Pay", quotation: "MASB/QT/TRA/2026/0072", trainingDate: "21 Apr 2026" },
  { no: 6, company: "UniKL MIDI", title: "Workshop - Industrial Design (In-House)", invoiceNo: "95000026/2026", value: 1360, sst: 108.80, total: 1468.80, invoiceDate: "13 Apr 2026", paymentStatus: "UNPAID", daysOutstanding: 135, pic: "Adilah", paymentMethod: "Self-Pay", quotation: "MASB/QT/TRA/2026/0077rev2", trainingDate: "6 Apr 2026" },
  { no: 7, company: "MIMOS Berhad", title: "AI Prompt Skills: Best Practices (In-House)", invoiceNo: "95000016/2026", value: 8500, sst: 680, total: 9180, invoiceDate: "27 Mar 2026", paymentStatus: "PAID", daysOutstanding: 0, paymentDate: "6 Apr 2026", pic: "Adilah", paymentMethod: "HRDCorp", quotation: "MA/QT/2026(0001)", trainingDate: "6 Jan 2026" },
  { no: 8, company: "PUNB", title: "AI System Thinking (In-House)", invoiceNo: "95000054/2026", value: 19444.44, sst: 1555.56, total: 21000, invoiceDate: "21 May 2026", paymentStatus: "PAID", daysOutstanding: 0, paymentDate: "26 May 2026", pic: "Adilah", paymentMethod: "HRDCorp", quotation: "MASB/QT/TRA/2026/0076rev2", trainingDate: "13-14 May 2026" },
  { no: 9, company: "MIMOS Services Sdn Bhd", title: "Leadership & Shared Vision (In-House)", invoiceNo: "95000251/2026", value: 19444.44, sst: 1555.56, total: 21000, invoiceDate: "23 Apr 2026", paymentStatus: "PAID", daysOutstanding: 0, paymentDate: "20 May 2026", pic: "Adilah", paymentMethod: "HRDCorp", quotation: "MASB/QT/TRA/2026/0036rev2", trainingDate: "2-3 Apr 2026" },
  { no: 10, company: "KETENGAH", title: "AI System Thinking (In-House)", invoiceNo: "95000060/2026", value: 20865.60, sst: 1669.25, total: 22534.85, invoiceDate: "15 Jun 2026", paymentStatus: "PAID", daysOutstanding: 0, paymentDate: "28 Jun 2026", pic: "Farrah", paymentMethod: "ePerolehan", quotation: "MASB/QT/TRA/2026/0035Rev1", trainingDate: "8-9 Jun 2026" },
  { no: 11, company: "University College TATI", title: "AI System Thinking (Public)", invoiceNo: "95000019/2026", value: 4166.67, sst: 333.33, total: 4500, invoiceDate: "27 Mar 2026", paymentStatus: "UNPAID", daysOutstanding: 152, pic: "Adilah", paymentMethod: "Self-Pay", quotation: "MASB/QT/TRA/2026/0066", trainingDate: "9-10 Feb 2026" },
  { no: 12, company: "Kementerian Sumber Manusia", title: "Training - Vibe Coding", invoiceNo: "95000033/2026", value: 23145.83, sst: 1851.67, total: 24997.50, invoiceDate: "27 Apr 2026", paymentStatus: "PAID", daysOutstanding: 0, paymentDate: "15 May 2026", pic: "Farrah", paymentMethod: "Self-Pay", quotation: "PO260000000210123", trainingDate: "13 May - 15 Jun 2026" },
];

const OPPORTUNITIES = [
  { no: 1, client: "Jabatan Pendaftaran Negara", project: "AI System & National ID Training", type: "MIMOS Academy", forecast: 7800000, status: "Proposal/Tender submitted", probability: 0.5, weighted: 3900000, quarter: "Q4 2026", sector: "Government", pic: "Farrah" },
  { no: 2, client: "Global Electronics Association", project: "Semiconductor Training Program (IPC)", type: "MIMOS Academy", forecast: 3000000, status: "Qualified lead/Tender in progress", probability: 0.3, weighted: 900000, quarter: "Q4 2026", sector: "Industry", pic: "Farrah" },
  { no: 3, client: "Yayasan Peneraju", project: "AI & Digital Skills Program", type: "MIMOS Academy", forecast: 1650000, status: "Proposal/Tender submitted", probability: 0.5, weighted: 825000, quarter: "Q3 2026", sector: "Government", pic: "Adilah" },
  { no: 4, client: "PTPK / JPK", project: "TVET AI Integration Training", type: "MIMOS Academy", forecast: 700000, status: "Proposal/Tender submitted", probability: 0.5, weighted: 350000, quarter: "Q3 2026", sector: "Government", pic: "Farrah" },
  { no: 5, client: "MCMC Academy", project: "Digital Transformation Training", type: "MIMOS Academy", forecast: 600000, status: "Proposal/Tender submitted", probability: 0.5, weighted: 300000, quarter: "Q4 2026", sector: "Government", pic: "Adilah" },
  { no: 6, client: "MARA", project: "AI Skills for Bumiputera Entrepreneurs", type: "MIMOS Academy", forecast: 500000, status: "Qualified lead/Tender in progress", probability: 0.3, weighted: 150000, quarter: "Q4 2026", sector: "Government", pic: "Adilah" },
  { no: 7, client: "APD K-Youth Programme", project: "AI Digital Skills for Youth (Group)", type: "MIMOS Academy", forecast: 455000, status: "In Progress", probability: 0.7, weighted: 318500, quarter: "Q3 2026", sector: "Government", pic: "Omar" },
  { no: 8, client: "Protege Program (MTV)", project: "Graduate Digital Skills Program", type: "MIMOS Academy", forecast: 720000, status: "Negotiation stage", probability: 0.7, weighted: 504000, quarter: "Q3 2026", sector: "Government", pic: "Sarah" },
  { no: 9, client: "Hybrid Intelligence", project: "Advanced AI Training Program", type: "MIMOS Academy", forecast: 340000, status: "In Progress", probability: 0.6, weighted: 204000, quarter: "Q3 2026", sector: "Corporate", pic: "Farrah" },
  { no: 10, client: "mimos solutions", project: "Workshop & Training Suite", type: "MIMOS Academy", forecast: 496800, status: "In Progress", probability: 0.6, weighted: 298080, quarter: "Q3 2026", sector: "Corporate", pic: "Solehin" },
  { no: 11, client: "TNB ILSAS", project: "In-House AI Training", type: "MIMOS Academy", forecast: 82000, status: "Contract signed/PO issued", probability: 1.0, weighted: 82000, quarter: "Q3 2026", sector: "GLC", pic: "Farrah", secured: 82000 },
  { no: 12, client: "Kementerian Sumber Manusia", project: "AI Vibe Coding", type: "MIMOS Academy", forecast: 24990, status: "Contract signed/PO issued", probability: 1.0, weighted: 24990, quarter: "Q1 2026", sector: "Government", pic: "Farrah", secured: 24990 },
  { no: 13, client: "BPM MINDEF", project: "Business Process Management AI", type: "MIMOS Academy", forecast: 134990, status: "Negotiation stage", probability: 0.7, weighted: 94493, quarter: "Q3 2026", sector: "Government", pic: "Adilah" },
  { no: 14, client: "Institut Aminuddin Baki", project: "Leadership AI Program", type: "MIMOS Academy", forecast: 49000, status: "In Progress", probability: 0.5, weighted: 24500, quarter: "Q3 2026", sector: "Government", pic: "Farrah" },
  { no: 15, client: "KETENGAH", project: "In-House AI Training (Phase 2)", type: "MIMOS Academy", forecast: 252000, status: "Early engagement", probability: 0.1, weighted: 25200, quarter: "Q4 2026", sector: "Government", pic: "Farrah" },
];

const ACTION_ITEMS = [
  { id: 1, priority: "HIGH", category: "Invoice Overdue", title: "MINDEF - Inv #95000053/2026", detail: "Overdue 97 days — RM 49,987.80 (incl SST)", pic: "Adilah", daysOverdue: 97, amount: 46285, status: "UNPAID", type: "overdue_invoice" },
  { id: 2, priority: "HIGH", category: "Invoice Overdue", title: "University College TATI - Inv #95000019/2026", detail: "Overdue 152 days — RM 4,500.00", pic: "Adilah", daysOverdue: 152, amount: 4166.67, status: "UNPAID", type: "overdue_invoice" },
  { id: 3, priority: "HIGH", category: "Invoice Overdue", title: "SIRIM Academy - Inv #95000024/2026", detail: "Overdue 142 days — RM 20,999.00", pic: "Farrah", daysOverdue: 142, amount: 19443.52, status: "UNPAID", type: "overdue_invoice" },
  { id: 4, priority: "HIGH", category: "Invoice Overdue", title: "Pahang Skills Dev Center - Inv #95000025/2026", detail: "Overdue 142 days — RM 8,640.00", pic: "Adilah", daysOverdue: 142, amount: 8000, status: "UNPAID", type: "overdue_invoice" },
  { id: 5, priority: "HIGH", category: "Invoice Overdue", title: "MIMOS Services Sdn Bhd - Inv #13000029/2026", detail: "Overdue 118 days — RM 28,944.00", pic: "Adilah", daysOverdue: 118, amount: 26800, status: "UNPAID", type: "overdue_invoice" },
  { id: 6, priority: "MED", category: "Pending Follow-up", title: "GEA IPC - RM 3,000,000 Opportunity", detail: "Pending 47 days — No update from client", pic: "Farrah", daysOverdue: 47, amount: 3000000, status: "PENDING", type: "pending_quo" },
  { id: 7, priority: "MED", category: "Pending Follow-up", title: "Protege Program MTV - RM 720,000", detail: "Pending 22 days — Negotiation stalled", pic: "Sarah", daysOverdue: 22, amount: 720000, status: "PENDING", type: "pending_quo" },
  { id: 8, priority: "MED", category: "Missing PO", title: "MIMOS Solutions Sdn Bhd - 3 invoices pending", detail: "Invoiced but PO not uploaded to system", pic: "Adilah", daysOverdue: 15, amount: 20999, status: "MISSING_PO", type: "missing_po" },
  { id: 9, priority: "LOW", category: "Incomplete R2", title: "1 NADI Program - Participant data incomplete", detail: "3 sessions (Jul 20-24) participant demographics missing", pic: "Solehin", daysOverdue: 5, amount: 0, status: "MISSING_DATA", type: "incomplete_r2" },
  { id: 10, priority: "LOW", category: "Data Quality", title: "MINDEF status mismatch", detail: "R1 shows PAID but invoice_2026 shows UNPAID — reconciliation needed", pic: "Admin", daysOverdue: 10, amount: 46285, status: "DATA_ERROR", type: "data_error" },
];

const TRAINING_SESSIONS = [
  { no: 1, date: "6 Jan 2026", title: "AI Prompt Skills: Best Practices for Org Productivity", company: "MIMOS Berhad", type: "In-House", participants: 17, bumi: 12, nonBumi: 5, status: "COMPLETED" },
  { no: 2, date: "28-29 Jan 2026", title: "AI System Thinking: Training for Efficiency", company: "FGV R&D / NUMIX", type: "Public", participants: 15, bumi: 9, nonBumi: 6, status: "COMPLETED" },
  { no: 3, date: "9-10 Feb 2026", title: "AI System Thinking (Public Class)", company: "University College TATI", type: "Public", participants: 17, bumi: 11, nonBumi: 6, status: "COMPLETED" },
  { no: 4, date: "10-11 Feb 2026", title: "AI System Thinking (Public Class)", company: "Pahang Skills Dev", type: "In-House", participants: 37, bumi: 30, nonBumi: 7, status: "COMPLETED" },
  { no: 5, date: "5 Mar 2026", title: "Applied AI for Office Productivity", company: "MIMOS Berhad", type: "In-House", participants: 26, bumi: 20, nonBumi: 6, status: "COMPLETED" },
  { no: 6, date: "5-6 Mar 2026", title: "Semiconductor Industry Overview", company: "SIRIM Academy", type: "In-House", participants: 11, bumi: 5, nonBumi: 6, status: "COMPLETED" },
  { no: 7, date: "10-11 Mar 2026", title: "AI Training for PLC Students", company: "Pahang Skills Dev", type: "In-House", participants: 25, bumi: 20, nonBumi: 5, status: "COMPLETED" },
  { no: 8, date: "13-15 Apr 2026", title: "AI Vibe Coding", company: "KESUMA", type: "In-House", participants: 20, bumi: 16, nonBumi: 4, status: "COMPLETED" },
  { no: 9, date: "20-24 Apr 2026", title: "TTT: Certified AI Trainer", company: "Multiple Participants", type: "Public", participants: 10, bumi: 8, nonBumi: 2, status: "COMPLETED" },
  { no: 10, date: "28 Apr 2026", title: "Digital Skills for Contractors", company: "CIDB / KKR", type: "Public", participants: 61, bumi: 52, nonBumi: 9, status: "COMPLETED" },
  { no: 11, date: "6 May 2026", title: "Introduction to Canva AI", company: "Multiple", type: "Public", participants: 35, bumi: 28, nonBumi: 7, status: "COMPLETED" },
  { no: 12, date: "20 May 2026", title: "AI Practitioner Series 1: Slide Creation", company: "Multiple", type: "Public", participants: 138, bumi: 110, nonBumi: 28, status: "COMPLETED" },
  { no: 13, date: "11-15 May 2026", title: "TTT: Certified AI Trainer", company: "MINDEF", type: "In-House", participants: 10, bumi: 10, nonBumi: 0, status: "COMPLETED" },
  { no: 14, date: "13-14 May 2026", title: "AI System Thinking", company: "PUNB", type: "In-House", participants: 25, bumi: 22, nonBumi: 3, status: "COMPLETED" },
  { no: 15, date: "8-9 Jun 2026", title: "AI for Office Productivity", company: "KETENGAH", type: "In-House", participants: 26, bumi: 24, nonBumi: 2, status: "COMPLETED" },
  { no: 16, date: "18 Jun 2026", title: "AI Practitioner Series 2: Video Editing", company: "Multiple", type: "Public", participants: 90, bumi: 72, nonBumi: 18, status: "COMPLETED" },
  { no: 17, date: "20-24 Jul 2026", title: "1 NADI 1 Prompt Engineering - Module 1 (Sesi 1)", company: "1 NADI", type: "Public", participants: 422, bumi: 360, nonBumi: 62, status: "COMPLETED" },
  { no: 18, date: "22 Jul 2026", title: "1 NADI 1 Prompt Engineering - Module 1 (Sesi 2)", company: "1 NADI", type: "Public", participants: 471, bumi: 400, nonBumi: 71, status: "COMPLETED" },
  { no: 19, date: "23 Jul 2026", title: "AI Practitioners Series 3: Data Analytics", company: "Multiple", type: "Public", participants: 158, bumi: 126, nonBumi: 32, status: "COMPLETED" },
  { no: 20, date: "24 Jul 2026", title: "1 NADI 1 Prompt Engineering - Module 1 (Sesi 3)", company: "1 NADI", type: "Public", participants: 363, bumi: 308, nonBumi: 55, status: "COMPLETED" },
  { no: 21, date: "5-6 Aug 2026", title: "AI System Thinking", company: "New Client", type: "In-House", participants: 24, bumi: 18, nonBumi: 6, status: "COMPLETED" },
];

const QUOTATIONS = [
  { no: 1, date: "18 Dec 2025", quotationNo: "MSSB/QT/TRA/2026/0001", company: "KENANGA INVESTOR BERHAD", project: "Train The Trainer (TTT)", type: "Public Training", value: 6944.44, status: "Delivered", pic: "Liyana Ayunni" },
  { no: 2, date: "18 Dec 2025", quotationNo: "MSSB/QT/TRA/2026/0002", company: "SGS", project: "In-House AI Training 20 pax", type: "In-House", value: 19444.44, status: "Pending", pic: "Mohd Najib" },
  { no: 3, date: "18 Dec 2025", quotationNo: "MSSB/QT/TRA/2026/0003", company: "MDEC", project: "Train The Trainer (TTT)", type: "Public Training", value: 6944.44, status: "Pending", pic: "Raja Nur Raja Talib" },
  { no: 4, date: "19 Dec 2025", quotationNo: "MSSB/QT/TRA/2026/0004", company: "Sustainable Business Network", project: "Train The Trainer (TTT)", type: "In-House", value: 19444.44, status: "Delivered", pic: "Sarimah Misman" },
  { no: 5, date: "19 Dec 2025", quotationNo: "MSSB/QT/TRA/2026/0005", company: "Sustainable Business Network", project: "AI Training for Office Productivity", type: "Public", value: 2500, status: "Pending", pic: "Sarimah Misman" },
  { no: 6, date: "5 Jan 2026", quotationNo: "MASB/QT/TRA/2026/0011rev1", company: "SIRIM Academy", project: "Semiconductor Industry Overview", type: "In-House", value: 19443.52, status: "Approved", pic: "Farrah" },
  { no: 7, date: "10 Jan 2026", quotationNo: "MASB/QT/TRA/2026/0032rev2", company: "MINDEF", project: "TTT: Certified AI Trainer (In-House)", type: "In-House", value: 46285, status: "Approved", pic: "Adilah" },
  { no: 8, date: "12 Jan 2026", quotationNo: "MASB/QT/TRA/2026/0035Rev1", company: "KETENGAH", project: "AI System Thinking (In-House)", type: "In-House", value: 20865.60, status: "Approved", pic: "Farrah" },
  { no: 9, date: "15 Jan 2026", quotationNo: "MASB/QT/TRA/2026/0036rev2", company: "MIMOS Services Sdn Bhd", project: "Leadership & Shared Vision (In-House)", type: "In-House", value: 46244.44, status: "Approved", pic: "Adilah" },
];

const DATA_ISSUES = [
  { id: 1, type: "Status Mismatch", severity: "HIGH", description: "MINDEF payment: R1 shows PAID, invoice_2026 shows UNPAID", affectedRecords: 1, action: "Reconcile" },
  { id: 2, type: "Missing Invoice No", severity: "MED", description: "UPM training (Apr 28) — Invoice No pending at Finance (Pending @ Fin)", affectedRecords: 1, action: "Request" },
  { id: 3, type: "Formula Errors", severity: "HIGH", description: "R1 Cost of Sales — 20+ rows with #REF! and #NAME? errors from formula references", affectedRecords: 20, action: "Fix" },
  { id: 4, type: "Quotation Prefix Mismatch", severity: "MED", description: "Mixed use of MSSB/QT/TRA and MASB/QT/TRA — same company, different prefix", affectedRecords: 12, action: "Normalise" },
  { id: 5, type: "Client Name Duplication", severity: "MED", description: "'MIMOS Berhad', 'MIMOS Services Sdn Bhd', 'MIMOS Solutions Sdn Bhd' treated as separate entities", affectedRecords: 6, action: "Merge" },
  { id: 6, type: "Unmatched Invoice", severity: "HIGH", description: "6 invoices (≈RM149,972) present in invoice_2026 but absent from cost_of_sales_2026", affectedRecords: 6, action: "Match" },
];

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

const fmt = (v) => `RM ${Number(v).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtK = (v) => {
  if (v >= 1000000) return `RM ${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `RM ${(v / 1000).toFixed(0)}K`;
  return `RM ${v.toFixed(0)}`;
};

const MimosLogo = ({ collapsed }) => (
  <div className="flex items-center gap-2 select-none">
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="4" fill="#9333EA"/>
      <path d="M18 28C18 28 7 20 7 13C7 9.13 12.04 6 18 6C23.96 6 29 9.13 29 13C29 20 18 28 18 28Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
      <path d="M18 26C18 26 8 19 8 13C8 9.68 12.47 7 18 7C23.53 7 28 9.68 28 13C28 19 18 26 18 26Z" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
      <path d="M18 24C18 24 9 18 9 13C9 10.24 13.03 8 18 8C22.97 8 27 10.24 27 13C27 18 18 24 18 24Z" fill="none" stroke="white" strokeWidth="1.5"/>
    </svg>
    {!collapsed && (
      <div className="flex flex-col leading-none">
        <span className="text-white font-bold text-sm tracking-wider">MIMOS</span>
        <span className="text-purple-300 font-semibold text-xs tracking-widest">ACADEMY</span>
      </div>
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    UNPAID: "bg-red-50 text-red-700 border-red-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    APPROVED: "bg-sky-50 text-sky-700 border-sky-200",
    "IN PROGRESS": "bg-blue-50 text-blue-700 border-blue-200",
    "Contract signed/PO issued": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Proposal/Tender submitted": "bg-blue-50 text-blue-700 border-blue-200",
    "Qualified lead/Tender in progress": "bg-amber-50 text-amber-700 border-amber-200",
    "Negotiation stage": "bg-purple-50 text-purple-700 border-purple-200",
    "Early engagement": "bg-slate-100 text-slate-600 border-slate-200",
    "Lost/No-go": "bg-red-50 text-red-600 border-red-200",
    "Verbal commitment": "bg-teal-50 text-teal-700 border-teal-200",
    "MISSING_PO": "bg-orange-50 text-orange-700 border-orange-200",
    "MISSING_DATA": "bg-slate-100 text-slate-600 border-slate-200",
    "DATA_ERROR": "bg-red-50 text-red-700 border-red-200",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const s = styles[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s}`}>
      {status}
    </span>
  );
};

const KPICard = ({ icon: Icon, label, value, sub, subColor, trend }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
        <Icon size={16} className="text-blue-600" />
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    {sub && (
      <div className={`text-xs font-medium flex items-center gap-1 ${subColor || "text-slate-500"}`}>
        {trend === "up" && <ArrowUpRight size={12} />}
        {trend === "down" && <ArrowDownRight size={12} />}
        {sub}
      </div>
    )}
  </div>
);

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Main" },
  { key: "action-center", label: "Action Center", icon: AlertTriangle, badge: 10, badgeColor: "bg-red-500", group: "Main" },
  { key: "executive", label: "Executive Board", icon: TrendingUp, group: "Main" },
  { key: "opportunities", label: "R3 Sales Funnel", icon: Filter, group: "R3 Sales" },
  { key: "quotations", label: "Quotations", icon: FileText, group: "R3 Sales" },
  { key: "invoices", label: "Invoices & Aging", icon: Receipt, group: "R1 Finance" },
  { key: "payments", label: "Payments Received", icon: CreditCard, group: "R1 Finance" },
  { key: "training", label: "Training Programs", icon: GraduationCap, group: "R2 Training" },
  { key: "participants", label: "Participant Analytics", icon: Users, group: "R2 Training" },
  { key: "program360", label: "Program 360° View", icon: Eye, group: "R2 Training" },
  { key: "import", label: "Import Center", icon: UploadCloud, group: "Data" },
  { key: "data-quality", label: "Data Quality Audit", icon: ShieldAlert, group: "Data" },
  { key: "reports", label: "Reports Hub", icon: BarChart3, group: "Data" },
  { key: "users", label: "Users & Roles", icon: UserCog, group: "System" },
  { key: "settings", label: "Settings & Mapping", icon: Sliders, group: "System" },
];

const Sidebar = ({ current, navigate, collapsed, setCollapsed }) => {
  const groups = [...new Set(NAV_ITEMS.map((i) => i.group))];
  return (
    <div className={`flex flex-col h-screen bg-slate-900 border-r border-slate-700 transition-all duration-300 ${collapsed ? "w-16" : "w-64"} fixed left-0 top-0 z-40`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <MimosLogo collapsed={collapsed} />
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <X size={16} />}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {groups.map((group) => (
          <div key={group} className="mb-2">
            {!collapsed && (
              <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">{group}</div>
            )}
            {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
              const Icon = item.icon;
              const active = current === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all relative group ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className={`ml-auto text-xs font-bold ${item.badgeColor} text-white rounded-full w-5 h-5 flex items-center justify-center`}>
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 transition-opacity">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-700">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">DR</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">Dr. Nizar</div>
              <div className="text-xs text-slate-400">Super Admin</div>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mx-auto">DR</div>
        )}
      </div>
    </div>
  );
};

// ─── TOPBAR ───────────────────────────────────────────────────────────────────

const TopBar = ({ title, collapsed, navigate }) => (
  <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
    <div className="flex items-center gap-4">
      <div className="text-lg font-bold text-slate-900">{title}</div>
    </div>
    <div className="flex items-center gap-3">
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-72 focus:outline-none focus:border-blue-500 bg-slate-50"
          placeholder="Search programs, invoices, clients... (Ctrl+K)"
        />
      </div>
      <button
        onClick={() => navigate("import")}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Upload size={14} />
        <span className="hidden sm:block">Upload Excel</span>
      </button>
      <div className="relative">
        <button
          onClick={() => navigate("action-center")}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Bell size={18} className="text-slate-600" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">10</span>
        </button>
      </div>
      <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">DR</div>
    </div>
  </div>
);

// ─── PAGE: DASHBOARD ──────────────────────────────────────────────────────────

const Dashboard = ({ navigate }) => {
  const collectionRate = ((KPI_DATA.collected / KPI_DATA.totalInvoiced) * 100).toFixed(1);
  const totalBumi = TRAINING_SESSIONS.reduce((s, t) => s + t.bumi, 0);
  const totalNonBumi = TRAINING_SESSIONS.reduce((s, t) => s + t.nonBumi, 0);
  const bumiPct = ((totalBumi / (totalBumi + totalNonBumi)) * 100).toFixed(0);

  return (
    <div className="p-6 space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard icon={DollarSign} label="Total Invoiced" value={fmtK(KPI_DATA.totalInvoiced)} sub="+22% vs last quarter" subColor="text-emerald-600" trend="up" />
        <KPICard icon={CheckCircle} label="Cash Collected" value={fmtK(KPI_DATA.collected)} sub={`${collectionRate}% collection rate`} subColor="text-emerald-600" />
        <KPICard icon={Clock} label="Outstanding" value={fmtK(KPI_DATA.outstanding)} sub="6 invoices unpaid" subColor="text-red-600" trend="down" />
        <KPICard icon={Target} label="Weighted Forecast" value={fmtK(KPI_DATA.weightedForecast)} sub={`${KPI_DATA.totalOpportunities} active deals`} subColor="text-blue-600" trend="up" />
        <KPICard icon={GraduationCap} label="Participants Trained" value={KPI_DATA.totalParticipants.toLocaleString()} sub={`${KPI_DATA.totalSessions} sessions | ${bumiPct}% Bumi`} subColor="text-purple-600" />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Revenue vs Collection Trend 2026</h3>
              <p className="text-xs text-slate-500">Monthly invoiced amount vs cash collected</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block"></span>Invoiced</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>Collected</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={MONTHLY_DATA} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v, n) => [fmt(v), n === "invoiced" ? "Invoiced" : "Collected"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="invoiced" fill="#2563EB" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Line type="monotone" dataKey="collected" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, fill: "#059669" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Action Center Widget */}
        <div className="bg-white rounded-xl border border-red-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <h3 className="text-sm font-semibold text-slate-900">Action Required Today</h3>
            </div>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">10 Items</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="text-xs font-semibold text-red-700">⚠ 5 overdue invoices totalling</p>
            <p className="text-lg font-bold text-red-800">RM 104,694.72</p>
          </div>
          <div className="space-y-2">
            {ACTION_ITEMS.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => navigate("action-center")}
                className="w-full text-left flex items-start gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${item.priority === "HIGH" ? "bg-red-500" : "bg-amber-400"}`}></span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 truncate">{item.detail}</p>
                </div>
                <ChevronRight size={12} className="shrink-0 text-slate-400 mt-0.5 ml-auto" />
              </button>
            ))}
          </div>
          <button onClick={() => navigate("action-center")} className="mt-3 w-full text-center text-xs text-blue-600 font-semibold hover:underline">
            View all 10 action items →
          </button>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">R3 Sales Pipeline Funnel</h3>
          <div className="space-y-3">
            {PIPELINE_DATA.map((stage, i) => {
              const maxW = PIPELINE_DATA[0].value;
              const pct = (stage.value / maxW) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">{stage.stage}</span>
                    <span className="text-xs font-bold text-slate-800">{stage.value} deals · {fmtK(stage.amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: stage.fill }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate("opportunities")} className="mt-4 w-full text-center text-xs text-blue-600 font-semibold hover:underline">
            View full pipeline →
          </button>
        </div>

        {/* Training Impact */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">R2 Training Impact 2026</h3>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-slate-900">{KPI_DATA.totalParticipants.toLocaleString()}</div>
            <div className="text-sm text-slate-500">Total Participants Trained</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-purple-100 rounded-full h-3 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-purple-600 rounded-full" style={{ width: `${bumiPct}%` }}></div>
              </div>
              <span className="text-xs font-semibold text-purple-700 w-20 text-right">Bumi {bumiPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-blue-100 rounded-full h-3 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full" style={{ width: `${100 - bumiPct}%` }}></div>
              </div>
              <span className="text-xs font-semibold text-blue-700 w-20 text-right">Non-Bumi {100 - bumiPct}%</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-base font-bold text-slate-800">{KPI_DATA.totalSessions}</div>
              <div className="text-xs text-slate-500">Sessions</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-base font-bold text-slate-800">11</div>
              <div className="text-xs text-slate-500">Clients</div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Chain Activities</h3>
          <div className="space-y-3">
            {[
              { icon: CheckCircle, color: "text-emerald-500", text: "KETENGAH payment confirmed — RM 22,534", time: "2h ago" },
              { icon: Receipt, color: "text-blue-500", text: "Invoice 95000060/2026 generated for KETENGAH", time: "5h ago" },
              { icon: Upload, color: "text-purple-500", text: "1 NADI Module 2 (Sesi 3) data uploaded — 363 pax", time: "1d ago" },
              { icon: AlertTriangle, color: "text-red-500", text: "MINDEF invoice overdue flag raised — 97 days", time: "1d ago" },
              { icon: GraduationCap, color: "text-teal-500", text: "AI System Thinking session completed — 24 pax", time: "2d ago" },
              { icon: FileText, color: "text-amber-500", text: "Quotation sent to BPM MINDEF — RM 134,990", time: "3d ago" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <Icon size={14} className={`${item.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed">{item.text}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE: ACTION CENTER ──────────────────────────────────────────────────────

const ActionCenter = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState("all");
  const tabs = [
    { key: "all", label: "All Alerts", count: 10 },
    { key: "overdue_invoice", label: "Overdue Invoices", count: 5 },
    { key: "pending_quo", label: "Pending Follow-up", count: 2 },
    { key: "missing_po", label: "Missing PO", count: 1 },
    { key: "incomplete_r2", label: "Incomplete R2", count: 1 },
    { key: "data_error", label: "Data Issues", count: 1 },
  ];
  const filtered = activeTab === "all" ? ACTION_ITEMS : ACTION_ITEMS.filter((i) => i.type === activeTab);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Action Center</h2>
          <p className="text-sm text-slate-500">10 items require immediate attention today</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Download size={14} /> Export Critical Summary
        </button>
      </div>

      {/* Severity Banner */}
      <div className="bg-red-600 text-white rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} />
          <div>
            <p className="font-bold">5 Critical Overdue Invoices</p>
            <p className="text-sm text-red-100">Total at risk: RM 104,694.72 (excl SST)</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-red-100">Longest overdue:</p>
          <p className="font-bold">152 days</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === t.key ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
            <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${activeTab === t.key ? "bg-blue-500" : "bg-slate-200 text-slate-600"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title / Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">PIC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      item.priority === "HIGH" ? "bg-red-50 text-red-700 border-red-200" :
                      item.priority === "MED" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {item.priority === "HIGH" && "🔴"} {item.priority === "MED" && "🟡"} {item.priority === "LOW" && "🔵"} {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-600">{item.category}</span>
                    {item.daysOverdue > 0 && item.type === "overdue_invoice" && (
                      <div className="text-xs text-red-600 font-semibold">{item.daysOverdue} days overdue</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                  </td>
                  <td className="px-4 py-3">
                    {item.amount > 0 ? (
                      <span className={`font-bold text-sm ${item.priority === "HIGH" && item.type === "overdue_invoice" ? "text-red-700" : "text-slate-900"}`}>
                        {fmtK(item.amount)}
                      </span>
                    ) : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">{item.pic[0]}</div>
                      <span className="text-sm text-slate-700">{item.pic}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.type === "overdue_invoice" && (
                        <>
                          <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md font-medium hover:bg-blue-700 flex items-center gap-1"><Mail size={10} /> Follow Up</button>
                          <button onClick={() => navigate("program360")} className="px-2 py-1 border border-slate-200 text-slate-600 text-xs rounded-md hover:bg-slate-50 flex items-center gap-1"><Eye size={10} /> View Chain</button>
                        </>
                      )}
                      {item.type === "pending_quo" && (
                        <button className="px-2 py-1 bg-amber-500 text-white text-xs rounded-md font-medium hover:bg-amber-600 flex items-center gap-1"><Send size={10} /> Remind</button>
                      )}
                      {item.type === "missing_po" && (
                        <button className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md font-medium hover:bg-orange-600 flex items-center gap-1"><Upload size={10} /> Upload PO</button>
                      )}
                      {(item.type === "incomplete_r2" || item.type === "data_error") && (
                        <button className="px-2 py-1 bg-purple-500 text-white text-xs rounded-md font-medium hover:bg-purple-600 flex items-center gap-1"><Edit size={10} /> Resolve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE: OPPORTUNITIES ─────────────────────────────────────────────────────

const OpportunitiesPage = ({ navigate }) => {
  const [view, setView] = useState("list");
  const statusGroups = ["Contract signed/PO issued", "Negotiation stage", "Proposal/Tender submitted", "Qualified lead/Tender in progress", "Early engagement"];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">R3 Sales & Opportunity Funnel</h2>
          <p className="text-sm text-slate-500">{KPI_DATA.totalOpportunities} total opportunities · Weighted forecast RM 13.05M</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("list")} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${view === "list" ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600"}`}><List size={14} /> List</button>
          <button onClick={() => setView("kanban")} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${view === "kanban" ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600"}`}><Layers size={14} /> Board</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Forecast</p>
          <p className="text-xl font-bold text-slate-900">RM 59.3M</p>
          <p className="text-xs text-slate-400 mt-1">148 opportunities</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Weighted Forecast</p>
          <p className="text-xl font-bold text-blue-700">RM 13.05M</p>
          <p className="text-xs text-slate-400 mt-1">Probability-adjusted</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Secured / PO</p>
          <p className="text-xl font-bold text-emerald-700">RM 3.25M</p>
          <p className="text-xs text-slate-400 mt-1">43 deals won</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Conversion Rate</p>
          <p className="text-xl font-bold text-purple-700">29%</p>
          <p className="text-xs text-slate-400 mt-1">Lead → PO signed</p>
        </div>
      </div>

      {view === "list" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Forecast</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Probability</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Weighted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">PIC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OPPORTUNITIES.map((opp) => (
                  <tr key={opp.no} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{opp.client}</p>
                      <p className="text-xs text-slate-500">{opp.sector} · {opp.quarter}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs">
                      <p className="truncate">{opp.project}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{fmtK(opp.forecast)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${opp.probability * 100}%` }}></div>
                        </div>
                        <span className="text-xs font-medium text-slate-700">{(opp.probability * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-700">{fmtK(opp.weighted)}</td>
                    <td className="px-4 py-3"><StatusBadge status={opp.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{opp.pic}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate("program360")} className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1"><Eye size={12} /> View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
          {statusGroups.map((group) => {
            const items = OPPORTUNITIES.filter((o) => o.status === group || (group === "Negotiation stage" && o.status === "In Progress"));
            const total = items.reduce((s, o) => s + o.forecast, 0);
            const colors = {
              "Contract signed/PO issued": "border-emerald-300 bg-emerald-50",
              "Negotiation stage": "border-purple-300 bg-purple-50",
              "Proposal/Tender submitted": "border-blue-300 bg-blue-50",
              "Qualified lead/Tender in progress": "border-amber-300 bg-amber-50",
              "Early engagement": "border-slate-300 bg-slate-50",
            };
            return (
              <div key={group} className={`rounded-xl border-2 p-4 min-h-48 ${colors[group] || "border-slate-200 bg-white"}`}>
                <div className="text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider truncate">{group}</div>
                <div className="text-sm font-bold text-slate-900 mb-3">{fmtK(total)}</div>
                <div className="space-y-2">
                  {items.map((o) => (
                    <div key={o.no} className="bg-white rounded-lg p-2.5 border border-white shadow-sm">
                      <p className="text-xs font-semibold text-slate-800 truncate">{o.client}</p>
                      <p className="text-xs text-slate-500 truncate">{o.project}</p>
                      <p className="text-xs font-bold text-blue-700 mt-1">{fmtK(o.forecast)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── PAGE: INVOICES ───────────────────────────────────────────────────────────

const InvoicesPage = ({ navigate }) => {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? INVOICES : INVOICES.filter((i) => i.paymentStatus === filter);
  const outstanding = INVOICES.filter((i) => i.paymentStatus === "UNPAID").reduce((s, i) => s + i.value, 0);
  const paid = INVOICES.filter((i) => i.paymentStatus === "PAID").reduce((s, i) => s + i.value, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">R1 Invoices & Collection Aging</h2>
          <p className="text-sm text-slate-500">2026 Invoice Register</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"><Download size={14} /> Export R1</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">Total Invoiced</p>
          <p className="text-xl font-bold text-slate-900">RM 397,454</p>
          <p className="text-xs text-slate-400">{INVOICES.length} invoices</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4 bg-emerald-50">
          <p className="text-xs text-emerald-700 font-medium">Paid / Collected</p>
          <p className="text-xl font-bold text-emerald-800">{fmt(paid)}</p>
          <p className="text-xs text-emerald-600">{INVOICES.filter(i => i.paymentStatus === "PAID").length} invoices</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4 bg-red-50">
          <p className="text-xs text-red-700 font-medium">Outstanding</p>
          <p className="text-xl font-bold text-red-800">{fmt(outstanding)}</p>
          <p className="text-xs text-red-600">{INVOICES.filter(i => i.paymentStatus === "UNPAID").length} unpaid</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 bg-amber-50">
          <p className="text-xs text-amber-700 font-medium">Overdue &gt;30 Days</p>
          <p className="text-xl font-bold text-amber-800">{fmt(INVOICES.filter(i => i.paymentStatus === "UNPAID" && i.daysOutstanding > 30).reduce((s, i) => s + i.value, 0))}</p>
          <p className="text-xs text-amber-600">{INVOICES.filter(i => i.paymentStatus === "UNPAID" && i.daysOutstanding > 30).length} invoices</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "PAID", "UNPAID"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {f === "all" ? "All Invoices" : f === "PAID" ? "Paid" : "Outstanding"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Invoice No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Value (excl SST)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Total (incl SST)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Invoice Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Aging</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">PIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.no} className={`hover:bg-slate-50 transition-colors ${inv.paymentStatus === "UNPAID" && inv.daysOutstanding > 60 ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate("program360")} className="text-blue-600 hover:underline font-medium text-xs">{inv.invoiceNo}</button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{inv.company}</p>
                    <p className="text-xs text-slate-500">{inv.paymentMethod}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">
                    <p className="truncate text-xs">{inv.title}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{fmt(inv.value)}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{fmt(inv.total)}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{inv.invoiceDate}</td>
                  <td className="px-4 py-3">
                    {inv.paymentStatus === "UNPAID" ? (
                      <span className={`text-xs font-bold ${inv.daysOutstanding > 60 ? "text-red-700" : inv.daysOutstanding > 30 ? "text-amber-700" : "text-slate-600"}`}>
                        {inv.daysOutstanding}d
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">{inv.paymentDate || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={inv.paymentStatus} /></td>
                  <td className="px-4 py-3 text-slate-600 text-sm">{inv.pic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE: PROGRAM 360 ────────────────────────────────────────────────────────

const Program360 = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState("chain");
  const chainSteps = [
    { label: "Lead Registered", date: "5 Jan 2026", status: "completed" },
    { label: "Quotation Sent", date: "10 Jan 2026", status: "completed", ref: "MASB/QT/TRA/2026/0032rev2" },
    { label: "PO Received", date: "28 Apr 2026", status: "completed", ref: "ePerolehan" },
    { label: "Invoice Issued", date: "21 May 2026", status: "completed", ref: "95000053/2026" },
    { label: "Payment", date: "Pending", status: "error" },
    { label: "Training Done", date: "15 May 2026", status: "completed" },
  ];

  return (
    <div className="p-6 space-y-5">
      <button onClick={() => navigate("invoices")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium">
        <ArrowLeft size={14} /> Back to Invoices
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">PRG-2026-0018</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Artificial Intelligence</span>
              <StatusBadge status="UNPAID" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">TTT: Certified AI Trainer & Integration</h2>
            <p className="text-sm text-slate-600 mt-1">MINDEF — Kementerian Pertahanan Malaysia</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border border-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 flex items-center gap-1"><FileText size={14} /> Generate PDF</button>
            <button className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-1"><Mail size={14} /> Send Follow-up</button>
          </div>
        </div>

        {/* Chain Stepper */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">End-to-End Chain Status</h3>
          <div className="flex items-start justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 z-0"></div>
            {chainSteps.map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2 text-center" style={{ flex: 1 }}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step.status === "completed" ? "bg-blue-600 border-blue-600 text-white" :
                  step.status === "error" ? "bg-red-500 border-red-500 text-white animate-pulse" :
                  "bg-white border-slate-300 text-slate-400"
                }`}>
                  {step.status === "completed" ? "✓" : step.status === "error" ? "!" : i + 1}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{step.label}</p>
                  <p className="text-xs text-slate-400">{step.date}</p>
                  {step.ref && <p className="text-xs text-blue-600 font-medium">{step.ref}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {[
          { key: "chain", label: "Overview & Chain" },
          { key: "financials", label: "Financials" },
          { key: "training", label: "R2 Training" },
          { key: "audit", label: "Audit Log" },
        ].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === "chain" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Financial Chain Summary</h3>
            <div className="space-y-3">
              {[
                { label: "Proposal / Forecast Value", value: "RM 50,000.00", color: "text-slate-700" },
                { label: "Approved Quotation Value", value: "RM 46,285.00", color: "text-slate-700" },
                { label: "PO Value (ePerolehan)", value: "RM 46,285.00", color: "text-slate-700" },
                { label: "Invoice Amount (excl SST)", value: "RM 46,285.00", color: "text-slate-700" },
                { label: "SST 8%", value: "RM 3,702.80", color: "text-slate-500" },
                { label: "Total Invoice (incl SST)", value: "RM 49,987.80", color: "text-slate-900 font-bold" },
                { label: "Amount Collected", value: "RM 0.00", color: "text-red-700 font-bold" },
                { label: "Outstanding Balance", value: "RM 49,987.80", color: "text-red-700 font-bold" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{row.label}</span>
                  <span className={`text-sm ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <p className="text-sm text-red-700 font-semibold">Invoice overdue by 97 days. Immediate follow-up required.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Client & Contact</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2"><Building2 size={13} className="text-slate-400 mt-0.5" /><div><p className="text-sm font-semibold text-slate-900">MINDEF Malaysia</p><p className="text-xs text-slate-500">Kementerian Pertahanan</p></div></div>
                <div className="flex items-center gap-2"><User size={13} className="text-slate-400" /><p className="text-sm text-slate-700">Adilah (PIC)</p></div>
                <div className="flex items-center gap-2"><Globe size={13} className="text-slate-400" /><p className="text-sm text-slate-700">ePerolehan</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Mail size={13} /> Log Payment Received</button>
                <button className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50"><Send size={13} /> Send Email Reminder</button>
                <button className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50"><Upload size={13} /> Upload Attendance List</button>
                <button className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50"><FileText size={13} /> Generate Invoice PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "financials" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Invoice & Payment Details</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Invoice Details</h4>
              <div className="space-y-2">
                {[["Invoice No", "95000053/2026"], ["Invoice Date", "21 May 2026"], ["Payment Terms", "30 days"], ["Method", "ePerolehan"], ["Due Date", "20 Jun 2026"], ["Days Overdue", "97 days"]].map(([k, v], i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-sm text-slate-500">{k}</span><span className="text-sm font-medium text-slate-900">{v}</span></div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Related Documents</h4>
              <div className="space-y-2">
                {[["Quotation", "MASB/QT/TRA/2026/0032rev2", "APPROVED"], ["PO", "ePerolehan Portal", "RECEIVED"], ["Invoice", "95000053/2026", "UNPAID"]].map(([type, ref, status], i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div><p className="text-xs font-semibold text-slate-700">{type}</p><p className="text-xs text-slate-500">{ref}</p></div>
                    <StatusBadge status={status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "training" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">R2 Training & Participant Records</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="text-center p-3 bg-slate-50 rounded-lg"><p className="text-2xl font-bold text-slate-900">10</p><p className="text-xs text-slate-500">Total Participants</p></div>
            <div className="text-center p-3 bg-purple-50 rounded-lg"><p className="text-2xl font-bold text-purple-700">10</p><p className="text-xs text-purple-600">Bumiputera (100%)</p></div>
            <div className="text-center p-3 bg-blue-50 rounded-lg"><p className="text-2xl font-bold text-blue-700">0</p><p className="text-xs text-blue-600">Non-Bumiputera</p></div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg"><p className="text-2xl font-bold text-emerald-700">5 days</p><p className="text-xs text-emerald-600">Duration</p></div>
          </div>
          <div className="space-y-2">
            {[["Training Date", "11–15 May 2026"], ["Venue", "MIMOS Computer Lab 1"], ["Training Type", "TTT: Certified AI Trainer (In-House)"], ["Certification", "MIMOS Academy Certificate of Completion"], ["Status", "Completed"]].map(([k, v], i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-500">{k}</span><span className="text-sm font-semibold text-slate-900">{v}</span></div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity & Audit History</h3>
          <div className="space-y-3">
            {[
              { date: "27 Aug 2026", action: "System flagged invoice as critical overdue (97 days)", user: "System" },
              { date: "15 Aug 2026", action: "Email reminder sent to MINDEF contact via PIC Adilah", user: "Adilah" },
              { date: "1 Aug 2026", action: "Follow-up note logged — no response from client yet", user: "Adilah" },
              { date: "21 Jun 2026", action: "Invoice marked as overdue (>30 days) — auto-flag triggered", user: "System" },
              { date: "21 May 2026", action: "Invoice 95000053/2026 generated — RM 49,987.80", user: "Finance" },
              { date: "28 Apr 2026", action: "PO received via ePerolehan — RM 46,285.00", user: "Adilah" },
              { date: "15 May 2026", action: "Training completed — 10 participants (100% Bumiputera)", user: "Adilah" },
              { date: "10 Jan 2026", action: "Quotation MASB/QT/TRA/2026/0032rev2 sent — RM 46,285.00", user: "Adilah" },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">{log.action}</p>
                  <p className="text-xs text-slate-400">{log.date} · by {log.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGE: IMPORT CENTER ──────────────────────────────────────────────────────

const ImportCenter = () => {
  const [uploadStep, setUploadStep] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startUpload = () => {
    setUploadStep(1);
    setTimeout(() => setUploadStep(2), 1500);
    setTimeout(() => setUploadStep(3), 3000);
    setTimeout(() => setUploadStep(4), 4500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Import Center</h2>
          <p className="text-sm text-slate-500">Upload Excel files — R1, R2, R3, Quotation, Invoices, Cost of Sales</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"><Download size={14} /> Download Template</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); startUpload(); }}
          className={`rounded-xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"}`}
          onClick={startUpload}
        >
          <UploadCloud size={48} className="text-slate-400 mb-4" />
          <p className="text-base font-semibold text-slate-700">Drag & drop Excel file here</p>
          <p className="text-sm text-slate-500 mt-1">or click to browse · Supports .xlsx, .xls, .csv</p>
          <div className="mt-4 flex gap-2 flex-wrap justify-center">
            {["R1 Income", "R2 Training", "R3 Funnel", "Quotation", "Invoice", "Cost of Sales"].map((t) => (
              <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{t}</span>
            ))}
          </div>
        </div>

        {/* Pipeline Steps */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Upload Validation Pipeline</h3>
          <div className="space-y-3">
            {[
              { step: 1, label: "File Integrity Check", desc: "Verify file format, sheet names, and column headers" },
              { step: 2, label: "Column Mapping Verification", desc: "Map Excel columns to system fields" },
              { step: 3, label: "Duplicate & Mismatch Detection", desc: "Hash-based row deduplication + chain matching" },
              { step: 4, label: "Commit to Database", desc: "Final save with audit log entry" },
            ].map((s) => (
              <div key={s.step} className={`flex items-start gap-3 p-3 rounded-lg border ${uploadStep > s.step ? "border-emerald-200 bg-emerald-50" : uploadStep === s.step ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${uploadStep > s.step ? "bg-emerald-500 text-white" : uploadStep === s.step ? "bg-blue-600 text-white animate-pulse" : "bg-slate-200 text-slate-500"}`}>
                  {uploadStep > s.step ? "✓" : s.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import Summary (sample) */}
      {uploadStep >= 4 && (
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={20} className="text-emerald-600" />
            <h3 className="text-sm font-semibold text-emerald-800">Import Completed Successfully</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[["Total Rows Parsed", "142", "text-slate-900"], ["New Records Created", "12", "text-emerald-700"], ["Records Updated", "125", "text-blue-700"], ["Rejected / Errors", "5", "text-red-700"]].map(([label, val, color]) => (
              <div key={label} className="text-center p-3 bg-slate-50 rounded-lg">
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Validation Errors (5 rows)</h4>
          <div className="space-y-2">
            {[
              { row: 3, issue: "#REF! in Invoice Value column — formula reference broken", action: "Fix" },
              { row: 7, issue: "Date format invalid: '28-29 Jan 26' not parseable as date", action: "Fix" },
              { row: 15, issue: "Quotation No MSSB/QT/TRA/2026/0001 — possible duplicate of MASB/QT/TRA/2026/0001", action: "Review" },
              { row: 22, issue: "Client 'MIMOS Berhad' — possible match to 'MIMOS Services Sdn Bhd'", action: "Merge" },
              { row: 31, issue: "#DIV/0! in % Profit column — zero denominator", action: "Fix" },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                <FileWarning size={14} className="text-red-500 shrink-0" />
                <div className="flex-1"><p className="text-xs font-medium text-slate-700">Row {e.row}: {e.issue}</p></div>
                <button className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium hover:bg-red-700">{e.action}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Imports */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200"><h3 className="text-sm font-semibold text-slate-900">Import History</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">File</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Uploaded By</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Rows</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              ["R2_Overall_Report_2026.xlsx", "R2 Training", "Solehin", "19 Aug 2026", "81", "COMPLETED"],
              ["office_funnel_2026-08-19.xlsx", "Office Funnel", "Sarah", "19 Aug 2026", "101", "COMPLETED"],
              ["sales_report_2026-08-19.xlsx", "R3 Sales", "Farrah", "19 Aug 2026", "157", "COMPLETED"],
              ["invoice_2026.xlsx", "R1 Invoice", "Adilah", "15 Aug 2026", "30", "COMPLETED"],
              ["R3_Group_2026_Funnel_Tracker.xlsx", "R3 Funnel", "Farrah", "10 Aug 2026", "181", "PARTIAL"],
            ].map(([file, type, user, date, rows, status], i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{file}</td>
                <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{type}</span></td>
                <td className="px-4 py-3 text-slate-600">{user}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{date}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{rows}</td>
                <td className="px-4 py-3"><StatusBadge status={status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── PAGE: DATA QUALITY ───────────────────────────────────────────────────────

const DataQuality = () => (
  <div className="p-6 space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Data Quality & Audit Center</h2>
        <p className="text-sm text-slate-500">6 data debt issues detected — resolve to improve system accuracy</p>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[["Total Issues", "6", "text-red-700", "bg-red-50 border-red-200"], ["Critical", "3", "text-red-700", "bg-red-50 border-red-200"], ["Medium", "2", "text-amber-700", "bg-amber-50 border-amber-200"], ["Low", "1", "text-slate-700", "bg-slate-50 border-slate-200"]].map(([label, val, textColor, bg], i) => (
        <div key={i} className={`rounded-xl border p-4 ${bg}`}>
          <p className="text-xs font-medium text-slate-600">{label}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{val}</p>
        </div>
      ))}
    </div>

    <div className="space-y-3">
      {DATA_ISSUES.map((issue) => (
        <div key={issue.id} className={`bg-white rounded-xl border p-5 shadow-sm flex items-start gap-4 ${issue.severity === "HIGH" ? "border-red-200" : issue.severity === "MED" ? "border-amber-200" : "border-slate-200"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${issue.severity === "HIGH" ? "bg-red-100" : "bg-amber-100"}`}>
            <AlertCircle size={16} className={issue.severity === "HIGH" ? "text-red-600" : "text-amber-600"} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${issue.severity === "HIGH" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{issue.severity}</span>
              <span className="text-xs text-slate-500 font-medium uppercase">{issue.type}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">{issue.description}</p>
            <p className="text-xs text-slate-500">{issue.affectedRecords} record{issue.affectedRecords > 1 ? "s" : ""} affected</p>
          </div>
          <button className={`px-3 py-1.5 text-sm font-semibold rounded-lg ${issue.severity === "HIGH" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}`}>{issue.action}</button>
        </div>
      ))}
    </div>

    {/* Client Alias Management */}
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Client Entity Aliases (Master Data)</h3>
      <div className="space-y-3">
        {[
          { master: "MIMOS Berhad (Master)", aliases: ["MIMOS", "MIMOS Bhd", "MIMOS BHD"], status: "Confirmed" },
          { master: "MIMOS Services Sdn Bhd", aliases: ["MIMOS Services", "MSSB"], status: "Pending" },
          { master: "MIMOS Solutions Sdn Bhd", aliases: ["MIMOS Solutions", "MSolSB"], status: "Pending" },
          { master: "Kementerian Pertahanan Malaysia", aliases: ["MINDEF", "KPT", "Kementerian Pertahanan"], status: "Confirmed" },
        ].map((entity, i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-slate-900">{entity.master}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {entity.aliases.map((alias) => (
                  <span key={alias} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{alias}</span>
                ))}
              </div>
            </div>
            <StatusBadge status={entity.status === "Confirmed" ? "PAID" : "PENDING"} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── PAGE: EXECUTIVE DASHBOARD ────────────────────────────────────────────────

const ExecutiveDashboard = ({ navigate }) => {
  const waterfallData = [
    { name: "Total Forecast", value: 13052298, fill: "#94A3B8" },
    { name: "Secured / PO", value: 3247076, fill: "#2563EB" },
    { name: "Invoiced", value: 397454, fill: "#7C3AED" },
    { name: "Cash Collected", value: 243569, fill: "#059669" },
    { name: "Outstanding", value: 153885, fill: "#DC2626" },
  ];
  const topClients = [
    { name: "MINDEF", value: 46285, status: "UNPAID" },
    { name: "MIMOS Services", value: 46244, status: "PARTIAL" },
    { name: "KETENGAH", value: 20866, status: "PAID" },
    { name: "PUNB", value: 19444, status: "PAID" },
    { name: "SIRIM Academy", value: 19444, status: "UNPAID" },
    { name: "Kementerian Sumber Manusia", value: 24998, status: "PAID" },
    { name: "KESUMA", value: 22998, status: "PAID" },
    { name: "Pahang Skills Dev", value: 22000, status: "PARTIAL" },
  ];
  const collectionRate = ((KPI_DATA.collected / KPI_DATA.totalInvoiced) * 100).toFixed(0);
  const totalBumi = TRAINING_SESSIONS.reduce((s, t) => s + t.bumi, 0);
  const totalNonBumi = TRAINING_SESSIONS.reduce((s, t) => s + t.nonBumi, 0);
  const bumiPct = ((totalBumi / (totalBumi + totalNonBumi)) * 100).toFixed(0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Executive Board Dashboard</h2>
          <p className="text-sm text-slate-500">MIMOS Academy — Performance Overview · As of 27 August 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"><Download size={14} /> Board Pack PDF</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Executive Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-xl p-5">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Revenue Secured</p>
          <p className="text-3xl font-bold">RM 3.25M</p>
          <p className="text-xs text-slate-400 mt-1">Confirmed PO/Contracts YTD</p>
          <div className="mt-2 h-1 bg-slate-700 rounded-full"><div className="h-1 bg-blue-500 rounded-full" style={{ width: "62%" }}></div></div>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-5">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Cash Collected</p>
          <p className="text-3xl font-bold">RM 243K</p>
          <p className="text-xs text-emerald-400 mt-1">↑ {collectionRate}% collection rate</p>
          <div className="mt-2 h-1 bg-slate-700 rounded-full"><div className="h-1 bg-emerald-500 rounded-full" style={{ width: `${collectionRate}%` }}></div></div>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-5">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Gross Profit Margin</p>
          <p className="text-3xl font-bold">~100%</p>
          <p className="text-xs text-amber-400 mt-1">⚠ Cost data incomplete</p>
          <div className="mt-2 h-1 bg-slate-700 rounded-full"><div className="h-1 bg-amber-500 rounded-full" style={{ width: "72%" }}></div></div>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-5">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Pipeline Coverage</p>
          <p className="text-3xl font-bold">32.8x</p>
          <p className="text-xs text-slate-400 mt-1">Forecast vs collected ratio</p>
          <div className="mt-2 h-1 bg-slate-700 rounded-full"><div className="h-1 bg-purple-500 rounded-full" style={{ width: "80%" }}></div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Revenue Stream */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Revenue Waterfall Stream</h3>
          <p className="text-xs text-slate-500 mb-4">Forecast → Secured → Invoiced → Collected</p>
          <div className="space-y-3">
            {waterfallData.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600">{item.name}</span>
                  <span className="text-sm font-bold text-slate-900">{fmtK(item.value)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="h-3 rounded-full" style={{ width: `${(item.value / 13052298) * 100}%`, backgroundColor: item.fill }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700">⚠ Revenue Leakage: RM 153,885 outstanding · RM 104,695 critically overdue</p>
          </div>
        </div>

        {/* Cash Conversion Speedometer */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Cash Conversion Speed</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-24 overflow-hidden">
              <svg viewBox="0 0 200 100" className="w-full">
                <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#F1F5F9" strokeWidth="20" />
                <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#2563EB" strokeWidth="20"
                  strokeDasharray={`${(parseInt(collectionRate) / 100) * 283} 283`} strokeLinecap="round" />
                <text x="100" y="80" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#0F172A">{collectionRate}%</text>
                <text x="100" y="95" textAnchor="middle" fontSize="9" fill="#94A3B8">COLLECTION RATE</text>
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full mt-4">
              <div className="text-center"><p className="text-lg font-bold text-emerald-700">{fmt(KPI_DATA.collected)}</p><p className="text-xs text-slate-500">Collected</p></div>
              <div className="text-center"><p className="text-lg font-bold text-blue-700">{fmt(KPI_DATA.totalInvoiced)}</p><p className="text-xs text-slate-500">Invoiced</p></div>
              <div className="text-center"><p className="text-lg font-bold text-red-700">{fmt(KPI_DATA.outstanding)}</p><p className="text-xs text-slate-500">Outstanding</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* R2 National Talent Impact */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">R2 National Talent Impact — 2026</h3>
            <p className="text-xs text-slate-500">Bumiputera vs Non-Bumiputera training participation by programme</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{KPI_DATA.totalParticipants.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Total Trained</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-4xl font-bold text-purple-800">{bumiPct}%</p>
            <p className="text-sm font-semibold text-purple-700">Bumiputera</p>
            <p className="text-xs text-purple-500">{totalBumi.toLocaleString()} participants</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-4xl font-bold text-blue-800">{100 - parseInt(bumiPct)}%</p>
            <p className="text-sm font-semibold text-blue-700">Non-Bumiputera</p>
            <p className="text-xs text-blue-500">{totalNonBumi.toLocaleString()} participants</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-4xl font-bold text-slate-800">{KPI_DATA.totalSessions}</p>
            <p className="text-sm font-semibold text-slate-700">Training Sessions</p>
            <p className="text-xs text-slate-500">Jan–Aug 2026</p>
          </div>
        </div>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={TRAINING_SESSIONS.slice(0, 10).map(s => ({ name: s.company.split(' ')[0], bumi: s.bumi, nonBumi: s.nonBumi }))} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="bumi" name="Bumiputera" fill="#9333EA" radius={[2, 2, 0, 0]} />
              <Bar dataKey="nonBumi" name="Non-Bumiputera" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Client Contribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Top Client Contribution Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Invoice Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">% of Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topClients.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{fmt(c.value)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(c.value / 46285) * 100}%` }}></div>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{((c.value / KPI_DATA.totalInvoiced) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE: TRAINING PROGRAMS ──────────────────────────────────────────────────

const TrainingPage = () => (
  <div className="p-6 space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900">R2 Training Programs 2026</h2>
        <p className="text-sm text-slate-500">{TRAINING_SESSIONS.length} sessions · {KPI_DATA.totalParticipants.toLocaleString()} participants</p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"><Download size={14} /> Export R2</button>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard icon={Users} label="Total Participants" value={KPI_DATA.totalParticipants.toLocaleString()} sub="Jan–Aug 2026" />
      <KPICard icon={GraduationCap} label="Sessions" value={KPI_DATA.totalSessions} sub="37 completed" subColor="text-emerald-600" />
      <KPICard icon={Award} label="Bumiputera" value={`${Math.round(TRAINING_SESSIONS.reduce((s, t) => s + t.bumi, 0) / (TRAINING_SESSIONS.reduce((s, t) => s + t.bumi, 0) + TRAINING_SESSIONS.reduce((s, t) => s + t.nonBumi, 0)) * 100)}%`} sub={TRAINING_SESSIONS.reduce((s, t) => s + t.bumi, 0).toLocaleString() + " participants"} subColor="text-purple-600" />
      <KPICard icon={BookOpen} label="Unique Clients" value="20+" sub="Government & Corporate" />
    </div>

    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Programme</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Client / Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Participants</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Bumi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Non-Bumi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TRAINING_SESSIONS.map((s) => (
              <tr key={s.no} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{s.no}</td>
                <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{s.date}</td>
                <td className="px-4 py-3 max-w-xs"><p className="font-medium text-slate-900 truncate">{s.title}</p></td>
                <td className="px-4 py-3 text-slate-700">{s.company}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${s.type === "In-House" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{s.type}</span></td>
                <td className="px-4 py-3 font-bold text-slate-900 text-center">{s.participants}</td>
                <td className="px-4 py-3 text-purple-700 font-semibold text-center">{s.bumi}</td>
                <td className="px-4 py-3 text-blue-700 font-semibold text-center">{s.nonBumi}</td>
                <td className="px-4 py-3"><StatusBadge status="COMPLETED" /></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-300">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-sm font-bold text-slate-700">TOTAL</td>
              <td className="px-4 py-3 font-bold text-slate-900 text-center">{TRAINING_SESSIONS.reduce((s, t) => s + t.participants, 0).toLocaleString()}</td>
              <td className="px-4 py-3 font-bold text-purple-700 text-center">{TRAINING_SESSIONS.reduce((s, t) => s + t.bumi, 0).toLocaleString()}</td>
              <td className="px-4 py-3 font-bold text-blue-700 text-center">{TRAINING_SESSIONS.reduce((s, t) => s + t.nonBumi, 0).toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
);

// ─── PLACEHOLDER PAGES ────────────────────────────────────────────────────────

const PlaceholderPage = ({ title, desc }) => (
  <div className="p-6 flex flex-col items-center justify-center min-h-64">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <BarChart3 size={28} className="text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500 text-sm">{desc}</p>
      <p className="mt-4 text-xs text-slate-400 bg-slate-100 px-3 py-2 rounded-lg inline-block">Module ready — connect to Supabase backend to activate live data</p>
    </div>
  </div>
);

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

const PAGE_TITLES = {
  "dashboard": "Dashboard Utama",
  "action-center": "Action Center",
  "executive": "Executive Board Dashboard",
  "opportunities": "R3 Sales & Opportunity Funnel",
  "quotations": "Quotation Management",
  "invoices": "R1 Invoices & Aging",
  "payments": "Payments Received",
  "training": "R2 Training Programs",
  "participants": "Participant Analytics",
  "program360": "Program 360° View",
  "import": "Import Center",
  "data-quality": "Data Quality & Audit",
  "reports": "Reports Hub",
  "users": "Users & Roles",
  "settings": "Settings & Mapping",
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const ml = collapsed ? "ml-16" : "ml-64";

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard navigate={setPage} />;
      case "action-center": return <ActionCenter navigate={setPage} />;
      case "executive": return <ExecutiveDashboard navigate={setPage} />;
      case "opportunities": return <OpportunitiesPage navigate={setPage} />;
      case "invoices": return <InvoicesPage navigate={setPage} />;
      case "training": return <TrainingPage />;
      case "program360": return <Program360 navigate={setPage} />;
      case "import": return <ImportCenter />;
      case "data-quality": return <DataQuality />;
      case "quotations": return <PlaceholderPage title="Quotation Management" desc="View and manage all 302 quotations — MSSB/QT/TRA and MASB/QT/TRA series with approval workflow." />;
      case "payments": return <PlaceholderPage title="Payments Received" desc="Track all payment receipts, HRDCorp claims, ePerolehan transactions and collection notes." />;
      case "participants": return <PlaceholderPage title="Participant Analytics" desc="Full Bumiputera / Non-Bumiputera breakdown, sector analysis, and demographic trends." />;
      case "reports": return <PlaceholderPage title="Reports Hub" desc="Generate R1 Income Statement, R2 Overall Report, R3 Sales Funnel, and Board Pack exports." />;
      case "users": return <PlaceholderPage title="Users & Roles (RBAC)" desc="Manage 18 staff accounts — MASB_Team, Manager, Viewer roles with granular data access." />;
      case "settings": return <PlaceholderPage title="Settings & Mapping" desc="Configure pipeline stage rules, quotation prefix normalisation, and client alias mapping." />;
      default: return <Dashboard navigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Sidebar current={page} navigate={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`transition-all duration-300 ${ml}`}>
        <TopBar title={PAGE_TITLES[page] || "MIMOS Academy"} collapsed={collapsed} navigate={setPage} />
        <main className="min-h-screen">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
