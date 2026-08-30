"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  Filter,
  FileText,
  FileCheck,
  Receipt,
  CreditCard,
  GraduationCap,
  Users,
  UploadCloud,
  ShieldAlert,
  BarChart3,
  UserCog,
  Sliders,
  Search,
  Plus,
  Bell,
  ArrowLeft,
  Mail,
  CheckCircle,
  Calendar,
  DollarSign,
  Globe,
  Building,
  Trash,
  Edit,
  Activity,
  FileSpreadsheet,
  Info,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Download,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  FileDown
} from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";
import { ChainStepper, ChainStep } from "@/components/ChainStepper";
import {
  RevenueTrendChart,
  WaterfallChart,
  DemographicPieChart,
  CashSpeedometer
} from "@/components/Charts";

import {
  getPrograms,
  getProgramById,
  updateProgram,
  addActivityLog,
  addProgram,
  deleteProgram,
  getClientAliases,
  addClientAlias,
  bulkUploadPrograms,
  Program360Record
} from "@/app/actions";

// Helper for formatting Ringgit Malaysia (RM)
const formatRM = (val: number) => {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(val);
};

interface MimosPortalProps {
  initialPrograms: Program360Record[];
  initialAliases: Array<{ id: number; aliasName: string; masterClientName: string }>;
}

export default function MimosPortal({ initialPrograms, initialAliases }: MimosPortalProps) {
  // --- Global States ---
  const [programsList, setProgramsList] = useState<Program360Record[]>(initialPrograms);
  const [aliasesList, setAliasesList] = useState(initialAliases);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("PRG-2026-0042");
  const [selectedProgramData, setSelectedProgramData] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<string>("Super Admin"); // RBAC: Super Admin, PIC, Management, Viewer
  
  // Collapsed sidebar
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
  
  // Search state
  const [searchQuery, setSearchString] = useState<string>("");
  const [showSearchModal, setSearchModalOpen] = useState<boolean>(false);
  
  // Date and filter states
  const [clientCategoryFilter, setClientCategoryFilter] = useState<string>("ALL");
  const [picFilter, setPicFilter] = useState<string>("ALL");
  
  // Modal states
  const [showAddModal, setAddModalOpen] = useState<boolean>(false);
  const [showFollowupModal, setFollowupModalOpen] = useState<boolean>(false);
  const [showAliasModal, setShowAliasModal] = useState<boolean>(false);
  
  // Live states for quick additions
  const [newAliasName, setNewAliasName] = useState("");
  const [newAliasMaster, setNewAliasMaster] = useState("");
  
  // Form state for creating new program
  const [addForm, setAddForm] = useState({
    programTitle: "",
    clientName: "",
    clientCategory: "GOVERNMENT",
    picName: "Fuzy",
    currentStage: "LEAD_REGISTERED",
    forecastValue: "50000",
    probability: "0.80",
    quotationNo: "",
    poNo: "",
    invoiceNo: "",
    invoiceAmount: "0",
    amountCollected: "0",
    totalParticipants: "0",
    bumiputeraCount: "0",
    nonBumiputeraCount: "0",
    daysOutstanding: "0",
    trainingStartDate: "",
    trainingEndDate: "",
  });

  // Action Center sub-tab state
  const [actionSubTab, setActionSubTab] = useState<string>("ALL");

  // Excel drag and drop simulation parser state
  const [excelImportText, setExcelImportText] = useState<string>("");
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [excelRowsSim, setExcelRowsSim] = useState<any[]>([
    {
      programTitle: "National Cybersecurity Boot Camp 2026",
      clientName: "Tenaga Nasional ILSAS", // will resolve to master "TNB ILSAS"
      clientCategory: "CORPORATE",
      picName: "Adila",
      currentStage: "INVOICED",
      forecastValue: "85000",
      probability: "1.00",
      quotationNo: "QT-2026-9041",
      poNo: "", // missing PO!
      invoiceNo: "MA/INV/2026/801",
      invoiceAmount: "85000",
      amountCollected: "0",
      daysOutstanding: "35",
      trainingStartDate: "2026-03-01",
      trainingEndDate: "2026-03-05",
      totalParticipants: "25",
      bumiputeraCount: "15",
      nonBumiputeraCount: "10",
      r2Status: "COMPLETED",
    },
    {
      programTitle: "Cloud Architecture Masterclass",
      clientName: "MB", // will resolve to master "MIMOS"
      clientCategory: "INTERNAL",
      picName: "Fuzy",
      currentStage: "TRAINING_COMPLETED",
      forecastValue: "42000",
      probability: "1.00",
      quotationNo: "QT-2026-9042",
      poNo: "PO-MIMOS-099",
      invoiceNo: "MA/INV/2026/802",
      invoiceAmount: "42000",
      amountCollected: "42000",
      daysOutstanding: "0",
      trainingStartDate: "2026-03-06",
      trainingEndDate: "2026-03-09",
      totalParticipants: "40",
      bumiputeraCount: "0", // Will trigger incomplete demographic warning!
      nonBumiputeraCount: "0",
      r2Status: "PENDING_DATA",
    },
    {
      programTitle: "SST Audit & Financial Analytics for Academy",
      clientName: "LHDN",
      clientCategory: "GOVERNMENT",
      picName: "Suhairi",
      currentStage: "PROPOSAL_SUBMITTED",
      forecastValue: "25000",
      probability: "0.50",
      quotationNo: "QT-2026-9043",
      poNo: "",
      invoiceNo: "",
      invoiceAmount: "0",
      amountCollected: "0",
      daysOutstanding: "0",
      trainingStartDate: "2026-05-10",
      trainingEndDate: "2026-05-13",
      totalParticipants: "0",
      bumiputeraCount: "0",
      nonBumiputeraCount: "0",
      r2Status: "UPCOMING",
    }
  ]);

  // Loading indicator for background db sync
  const [isSyncing, setIsSyncing] = useState(false);

  // Load Program 360 View detailed data
  useEffect(() => {
    async function load360() {
      if (!selectedProgramId) return;
      const res = await getProgramById(selectedProgramId);
      if (res) {
        setSelectedProgramData(res);
      }
    }
    load360();
  }, [selectedProgramId, programsList]);

  // Fetch updated data from DB
  const refreshDb = async () => {
    setIsSyncing(true);
    try {
      const progs = await getPrograms();
      const alis = await getClientAliases();
      setProgramsList(progs);
      setAliasesList(alis);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter logic
  const filteredPrograms = useMemo(() => {
    return programsList.filter((p) => {
      const matchCat = clientCategoryFilter === "ALL" || p.clientCategory === clientCategoryFilter;
      const matchPic = picFilter === "ALL" || p.picName === picFilter;
      return matchCat && matchPic;
    });
  }, [programsList, clientCategoryFilter, picFilter]);

  // Executive Statistics aggregates
  const stats = useMemo(() => {
    let totalRevenueSecured = 0; // Sum of invoiced + secured POs
    let collectedRevenue = 0;
    let outstandingCollection = 0;
    let forecastWeighted = 0;
    let sessionsCount = programsList.length;
    let totalBumi = 0;
    let totalNonBumi = 0;
    let criticalOverdueCount = 0;
    let missingPoCount = 0;
    let pendingQuoCount = 0;
    let incompleteR2Count = 0;

    programsList.forEach((p) => {
      const invVal = parseFloat(p.invoiceAmount) || 0;
      const colVal = parseFloat(p.amountCollected) || 0;
      const foreVal = parseFloat(p.forecastValue) || 0;
      const weightedVal = parseFloat(p.weightedValue) || 0;
      const poVal = parseFloat(p.poAmount) || 0;

      // Rule for total revenue secured: we count Invoiced Amount, if not invoiced but has PO, count PO Amount, otherwise nothing
      if (invVal > 0) {
        totalRevenueSecured += invVal;
      } else if (poVal > 0) {
        totalRevenueSecured += poVal;
      }

      collectedRevenue += colVal;
      outstandingCollection += (invVal - colVal);
      forecastWeighted += weightedVal;

      totalBumi += p.bumiputeraCount || 0;
      totalNonBumi += p.nonBumiputeraCount || 0;

      // Alerts count
      if (p.paymentStatus === "OVERDUE" && p.daysOutstanding > 30 && colVal < invVal) {
        criticalOverdueCount++;
      }
      if (p.currentStage === "INVOICED" && (!p.poNo || p.poNo.trim() === "")) {
        missingPoCount++;
      }
      // Quotation pending > 14 days
      if (p.currentStage === "PROPOSAL_SUBMITTED") {
        pendingQuoCount++;
      }
      // Incomplete R2 record (demographics missing)
      if (p.r2Status === "PENDING_DATA") {
        incompleteR2Count++;
      }
    });

    const totalTrained = totalBumi + totalNonBumi;
    const speed = totalRevenueSecured > 0 ? (collectedRevenue / totalRevenueSecured) * 100 : 0;

    return {
      totalRevenueSecured,
      collectedRevenue,
      outstandingCollection,
      forecastWeighted,
      sessionsCount,
      totalBumi,
      totalNonBumi,
      totalTrained,
      speed,
      criticalOverdueCount,
      missingPoCount,
      pendingQuoCount,
      incompleteR2Count,
      totalAlerts: criticalOverdueCount + missingPoCount + pendingQuoCount + incompleteR2Count,
    };
  }, [programsList]);

  // Global search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return programsList.filter(
      (p) =>
        p.programTitle.toLowerCase().includes(query) ||
        p.clientName.toLowerCase().includes(query) ||
        (p.quotationNo && p.quotationNo.toLowerCase().includes(query)) ||
        (p.invoiceNo && p.invoiceNo.toLowerCase().includes(query)) ||
        p.programId.toLowerCase().includes(query)
    );
  }, [programsList, searchQuery]);

  // --- Handlers for user interaction ---

  const handleRoleChange = (role: string) => {
    setActiveRole(role);
    addToast(`Peranan ditukar kepada: ${role}`, "info");
  };

  const checkRBAC = (allowedRoles: string[], actionName: string) => {
    if (!allowedRoles.includes(activeRole)) {
      alert(`[RBAC BLOCK] Akses Terhad! Peranan "${activeRole}" tidak dibenarkan untuk melakukan tindakan: "${actionName}". Sila tukar peranan anda di penjuru kanan atas.`);
      return false;
    }
    return true;
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRBAC(["Super Admin", "PIC"], "Tambah Rekod Baru")) return;

    try {
      const res = await addProgram({
        ...addForm,
        forecastValue: addForm.forecastValue,
        probability: addForm.probability,
        invoiceAmount: addForm.invoiceAmount,
        amountCollected: addForm.amountCollected,
        totalParticipants: parseInt(addForm.totalParticipants) || 0,
        bumiputeraCount: parseInt(addForm.bumiputeraCount) || 0,
        nonBumiputeraCount: parseInt(addForm.nonBumiputeraCount) || 0,
        daysOutstanding: parseInt(addForm.daysOutstanding) || 0,
      });

      if (res.success) {
        addToast(`Rekod baru berjaya ditambah dengan ID: ${res.id}`, "success");
        setAddModalOpen(false);
        // Reset form
        setAddForm({
          programTitle: "",
          clientName: "",
          clientCategory: "GOVERNMENT",
          picName: "Fuzy",
          currentStage: "LEAD_REGISTERED",
          forecastValue: "50000",
          probability: "0.80",
          quotationNo: "",
          poNo: "",
          invoiceNo: "",
          invoiceAmount: "0",
          amountCollected: "0",
          totalParticipants: "0",
          bumiputeraCount: "0",
          nonBumiputeraCount: "0",
          daysOutstanding: "0",
          trainingStartDate: "",
          trainingEndDate: "",
        });
        refreshDb();
      }
    } catch (e: any) {
      addToast(`Ralat: ${e.message}`, "error");
    }
  };

  // Simulating Toast notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const addToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Log Payment action
  const handleLogPayment = async (programId: string, amount: number) => {
    if (!checkRBAC(["Super Admin", "PIC", "Manager"], "Merekod Bayaran")) return;
    const prog = programsList.find((p) => p.programId === programId);
    if (!prog) return;

    const currentCollected = parseFloat(prog.amountCollected) || 0;
    const newCollected = currentCollected + amount;

    try {
      await updateProgram({
        programId,
        amountCollected: newCollected.toFixed(2),
        user: activeRole,
      });
      await addActivityLog(programId, activeRole, "PAYMENT_RECEIVED", `Menerima bayaran tunai sebanyak RM ${amount.toLocaleString()}. Jumlah terkumpul kini: RM ${newCollected.toLocaleString()}.`);
      addToast(`Bayaran RM ${amount.toLocaleString()} berjaya direkodkan!`, "success");
      refreshDb();
    } catch (e) {
      addToast("Gagal merekod bayaran.", "error");
    }
  };

  // Upload PO action
  const handleUploadPO = async (programId: string, poNumber: string, amount: string) => {
    if (!checkRBAC(["Super Admin", "PIC"], "Muat Naik PO")) return;
    try {
      await updateProgram({
        programId,
        poNo: poNumber,
        poAmount: amount,
        currentStage: "PO_RECEIVED",
        user: activeRole,
      });
      await addActivityLog(programId, activeRole, "PO_UPLOADED", `Surat Purchase Order (PO) Rasmi difailkan: ${poNumber} dengan nilai kontrak RM ${parseFloat(amount).toLocaleString()}.`);
      addToast(`PO ${poNumber} berjaya dimuat naik! Status dikemaskini ke PO Received.`, "success");
      refreshDb();
    } catch (e) {
      addToast("Gagal memuat naik PO.", "error");
    }
  };

  // Edit Demographic Participant Data action
  const handleSaveR2Demographics = async (programId: string, bumi: number, nonBumi: number) => {
    if (!checkRBAC(["Super Admin", "PIC"], "Kemaskini Data Peserta R2")) return;
    try {
      await updateProgram({
        programId,
        bumiputeraCount: bumi,
        nonBumiputeraCount: nonBumi,
        totalParticipants: bumi + nonBumi,
        user: activeRole,
      });
      await addActivityLog(programId, activeRole, "MANUAL_UPDATE", `Data Demografi Peserta R2 dikemaskini: Bumiputera = ${bumi}, Bukan Bumiputera = ${nonBumi}.`);
      addToast("Demografi peserta R2 berjaya dikemaskini!", "success");
      refreshDb();
    } catch (e) {
      addToast("Gagal mengemaskini demografi.", "error");
    }
  };

  // Run excel parsing simulation
  const handleSimulateExcelImport = async () => {
    if (!checkRBAC(["Super Admin", "PIC"], "Excel Import Ingestion")) return;
    setIsParsing(true);
    setImportLogs(["Memulakan saluran pengesahan integriti fail (Step 1)...", "Fail integrity pass: mimos_academy_master_tracker_2026.xlsx"]);
    
    setTimeout(() => {
      setImportLogs((prev) => [...prev, "Memulakan pengesahan lajur dan pemetaan tajuk (Step 2)...", "Lajur sepadan dengan Master Template MIMOS Academy."]);
    }, 600);

    setTimeout(() => {
      setImportLogs((prev) => [...prev, "Mengekstrak baris data & mengesan entiti alias (Step 3)...", "Dikesan: 'Tenaga Nasional ILSAS' dipetakan ke Master Client 'TNB ILSAS'.", "Dikesan: 'MB' dipetakan ke Master Client 'MIMOS'.", "Menjalankan Idempotent Hash & Matching Engine untuk mengelakkan rekod bertindih."]);
    }, 1200);

    setTimeout(async () => {
      try {
        const res = await bulkUploadPrograms(excelRowsSim);
        setImportLogs((prev) => [
          ...prev,
          "Menyimpan data ke pangkalan data sistem (Step 4)...",
          `Import selesai! Rekod Baru Dicipta: ${res.created}, Rekod Sedia Ada Dikemaskini: ${res.updated}.`,
          "Status: SELESAI DENGAN JAYA."
        ]);
        addToast(`Excel berjaya diimport! ${res.created} dicipta, ${res.updated} dikemaskini.`, "success");
        setIsParsing(false);
        refreshDb();
      } catch (err) {
        setImportLogs((prev) => [...prev, "Ralat kritikal semasa menyimpan rekod ke DB."]);
        setIsParsing(false);
      }
    }, 2000);
  };

  // Add Alias handler
  const handleAddAliasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRBAC(["Super Admin"], "Urus Alias Klien")) return;
    if (!newAliasName || !newAliasMaster) return;

    try {
      await addClientAlias(newAliasName, newAliasMaster);
      addToast(`Alias '${newAliasName}' -> Master '${newAliasMaster}' berjaya ditambah!`, "success");
      setNewAliasName("");
      setNewAliasMaster("");
      refreshDb();
    } catch (error) {
      addToast("Gagal menambah alias. Mungkin sudah wujud.", "error");
    }
  };

  // Delete program handler
  const handleDeleteProgramClick = async (id: string) => {
    if (!checkRBAC(["Super Admin"], "Hapus Rekod Program")) return;
    if (confirm(`Adakah anda pasti mahu pemadamkan program ${id}?`)) {
      try {
        await deleteProgram(id);
        addToast(`Program ${id} telah berjaya dipadamkan.`, "success");
        if (selectedProgramId === id) {
          setSelectedProgramId("PRG-2026-0042");
        }
        refreshDb();
      } catch (err) {
        addToast("Gagal memadam program.", "error");
      }
    }
  };

  // Inline Fix helper for simulator table
  const handleInlineFixRow = (index: number, key: string, val: any) => {
    const updated = [...excelRowsSim];
    updated[index] = { ...updated[index], [key]: val };
    setExcelRowsSim(updated);
    addToast(`Pindaan dalam draf baris #${index + 1} disimpan!`, "info");
  };

  // Generate Board Executive PDF print report
  const triggerPrintBoardReport = () => {
    window.print();
  };

  // Monthly Revenue Collection dummy data for Recharts combo chart
  const monthlyChartData = [
    { name: "Jan 2026", Invoiced: 500000, Collected: 420000 },
    { name: "Feb 2026", Invoiced: 950000, Collected: 600000 },
    { name: "Mac 2026", Invoiced: 1100000, Collected: 750000 },
    { name: "Apr 2026", Invoiced: 900000, Collected: 330000 },
  ];

  // Waterfall Chart data calculated dynamically
  const waterfallData = [
    { stage: "1. Forecast (R3)", value: stats.forecastWeighted },
    { stage: "2. Contract/PO Signed", value: stats.totalRevenueSecured * 1.15 }, // mock pipeline representation
    { stage: "3. Invoiced Revenue", value: stats.totalRevenueSecured },
    { stage: "4. Net Cash Collected", value: stats.collectedRevenue },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* --- TOAST ALERTS --- */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-xl shadow-2xl border bg-slate-900 border-slate-700 text-white animate-bounce">
          <div className="mr-3">
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
            {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          </div>
          <div className="text-sm font-semibold">{toast.message}</div>
          <button onClick={() => setToast(null)} className="ml-4 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --- TOP NAVIGATION BAR (Fixed 64px) --- */}
      <header className="bg-slate-900 text-white h-16 px-4 flex items-center justify-between fixed top-0 left-0 right-0 z-30 shadow-md">
        
        {/* Logo & System Switcher */}
        <div className="flex items-center space-x-3">
          <div className="bg-fuchsia-800 text-white font-extrabold px-3 py-1.5 rounded-lg text-sm tracking-wider flex items-center space-x-1 shadow-sm">
            <span>MIMOS</span>
            <span className="bg-white text-fuchsia-900 text-[10px] px-1 rounded-sm">ACADEMY</span>
          </div>
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          <span className="text-slate-200 font-bold text-xs bg-slate-800 px-2.5 py-1 rounded-md hidden sm:inline-block">
            R1/R2/R3 Executive Portal
          </span>
        </div>

        {/* Global Search Bar (Cmd + K) */}
        <div className="flex-1 max-w-md mx-6 hidden md:block">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700 px-4 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors focus:outline-none"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Cari Program, No. Sebut Harga, Invois, Klien...</span>
            </div>
            <kbd className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          
          {/* Refresh DB Sync */}
          <button
            onClick={refreshDb}
            title="Klik untuk selaraskan data dari pangkalan data PostgreSQL"
            className={`p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors ${
              isSyncing ? "animate-spin text-amber-400" : ""
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Quick Action Button */}
          <button
            onClick={() => {
              if (checkRBAC(["Super Admin", "PIC"], "Buka Borang Tambah")) {
                setAddModalOpen(true);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Tambah Rekod</span>
          </button>

          <button
            onClick={() => setActiveTab("import")}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden lg:inline">Muat Naik Excel</span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => {
              setActiveTab("action_center");
              addToast("Memuatkan Action Required Center...", "info");
            }}
            className="relative p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <Bell className="w-5 h-5" />
            {stats.totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {stats.totalAlerts}
              </span>
            )}
          </button>

          {/* Role Switcher RBAC dropdown */}
          <div className="h-6 w-px bg-slate-700" />
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase hidden lg:inline">Peranan:</span>
            <select
              value={activeRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Super Admin">🔑 Super Admin</option>
              <option value="PIC">🧑‍💼 PIC Program</option>
              <option value="Management">📈 Management (CEO)</option>
              <option value="Viewer">👁️ Viewer (Lihat Sahaja)</option>
            </select>
          </div>

        </div>
      </header>

      {/* --- GLOBAL SEARCH MODAL --- */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-500 w-full">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Taip program, no. sebut harga, invois, klien..."
                  value={searchQuery}
                  onChange={(e) => setSearchString(e.target.value)}
                  className="w-full text-sm focus:outline-none text-slate-800 placeholder-slate-400"
                  autoFocus
                />
              </div>
              <button onClick={() => setSearchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-2 max-h-96 overflow-y-auto bg-slate-50">
              {searchQuery === "" ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Sila taip sebarang carian untuk mencari merentas pangkalan data MIMOS.
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tiada rekod ditemui untuk &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((p) => (
                    <button
                      key={p.programId}
                      onClick={() => {
                        setSelectedProgramId(p.programId);
                        setActiveTab("program_360");
                        setSearchModalOpen(false);
                        setSearchString("");
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-blue-50 hover:text-blue-900 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-500">{p.programId} | {p.clientName}</p>
                        <p className="text-sm font-semibold text-slate-800">{p.programTitle}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-slate-100 px-4 py-2 text-[10px] text-slate-400 flex justify-between">
              <span>Gunakan anak panah untuk navigasi</span>
              <span>Tekan ESC untuk tutup</span>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN BODY CONTAINER --- */}
      <div className="flex flex-1 pt-16">
        
        {/* --- LEFT SIDEBAR (Collapsible - 260px expanded / 72px collapsed) --- */}
        <aside
          className={`bg-slate-950 text-slate-300 transition-all duration-300 flex flex-col justify-between border-r border-slate-800 shrink-0 ${
            sidebarExpanded ? "w-64" : "w-16"
          }`}
        >
          {/* Sidebar Menu */}
          <div className="py-4">
            
            {/* Collapse Trigger Button */}
            <div className="px-4 mb-4 flex justify-end">
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-900"
                title={sidebarExpanded ? "Kecilkan Menu" : "Kembangkan Menu"}
              >
                {sidebarExpanded ? "◀" : "▶"}
              </button>
            </div>

            <nav className="space-y-6">
              {/* Kumpulan: UTAMA */}
              <div>
                {sidebarExpanded && (
                  <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Utama
                  </p>
                )}
                <ul className="space-y-1 px-2">
                  <li>
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "dashboard"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>Dashboard Utama</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("action_center")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "action_center"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        {sidebarExpanded && <span>Action Center</span>}
                      </div>
                      {sidebarExpanded && stats.totalAlerts > 0 && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {stats.totalAlerts}
                        </span>
                      )}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("executive")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "executive"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      {sidebarExpanded && <span>Executive Board View</span>}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Kumpulan: R3 SALES */}
              <div>
                {sidebarExpanded && (
                  <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    R3 (Jualan)
                  </p>
                )}
                <ul className="space-y-1 px-2">
                  <li>
                    <button
                      onClick={() => setActiveTab("r3")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "r3"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Filter className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>R3 Sales Funnel</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("quotations")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "quotations"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>Sebut Harga / Quotations</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("pos")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "pos"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <FileCheck className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>Purchase Orders (PO)</span>}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Kumpulan: R1 FINANCIALS */}
              <div>
                {sidebarExpanded && (
                  <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    R1 (Kewangan)
                  </p>
                )}
                <ul className="space-y-1 px-2">
                  <li>
                    <button
                      onClick={() => setActiveTab("r1")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "r1"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Receipt className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>Invois & Aging</span>}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Kumpulan: R2 TRAINING */}
              <div>
                {sidebarExpanded && (
                  <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    R2 (Latihan)
                  </p>
                )}
                <ul className="space-y-1 px-2">
                  <li>
                    <button
                      onClick={() => setActiveTab("r2")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "r2"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>Program Latihan</span>}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Kumpulan: DATA & AUDIT */}
              <div>
                {sidebarExpanded && (
                  <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Tadbir Data & Sistem
                  </p>
                )}
                <ul className="space-y-1 px-2">
                  <li>
                    <button
                      onClick={() => setActiveTab("import")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "import"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>Import Center</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("data_quality")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "data_quality"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>Kualiti Data & Audit</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("rbac")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "rbac"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <UserCog className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>Users & Roles (RBAC)</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === "settings"
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Sliders className="w-4 h-4 shrink-0" />
                      {sidebarExpanded && <span>Tetapan Pemetaan</span>}
                    </button>
                  </li>
                </ul>
              </div>
            </nav>

          </div>

          {/* Active user state presentation at sidebar bottom */}
          {sidebarExpanded && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs">
              <p className="text-slate-500 font-bold text-[10px] uppercase">Pengguna Aktif</p>
              <p className="font-semibold text-slate-200">{activeRole}</p>
              <div className="mt-1.5 flex items-center space-x-2 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Mod Selamat Berpaut DB</span>
              </div>
            </div>
          )}
        </aside>

        {/* --- MAIN PAGE VIEWPORT --- */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">

          {/* Header Title with Breadcrumb & Global Filter strip */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <div className="flex items-center space-x-2 text-slate-400 text-xs mb-1 font-semibold uppercase">
                <span>MIMOS Academy</span>
                <span>/</span>
                <span>{activeTab.replace("_", " ")}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === "dashboard" && "Pusat Operasi R1/R2/R3"}
                {activeTab === "action_center" && "Pusat Tindakan & Aliran Pembocoran"}
                {activeTab === "executive" && "Papan Pemuka Eksekutif C-Suite"}
                {activeTab === "r3" && "Modul R3: Saluran & Ramalan Jualan"}
                {activeTab === "quotations" && "Modul R3: Pengurusan Sebut Harga"}
                {activeTab === "pos" && "Modul R3: Surat Pesanan Tempatan (PO)"}
                {activeTab === "r1" && "Modul R1: Kewangan, Invois & Kutipan Hasil"}
                {activeTab === "r2" && "Modul R2: Pengurusan Latihan & Impak Modal Insan"}
                {activeTab === "program_360" && "Unified Program CRM (Program 360°)"}
                {activeTab === "import" && "Pusat Import Excel & Pemulihan Entiti"}
                {activeTab === "data_quality" && "Pusat Pembersihan & Kualiti Data"}
                {activeTab === "rbac" && "Pengurusan Kawalan Akses (RBAC)"}
                {activeTab === "settings" && "Peraturan Pemetaan Status & Integrasi"}
              </h1>
              <p className="text-slate-500 text-xs mt-1">
                Portal pengurusan bersepadu MIMOS Academy untuk memantau rantaian perniagaan yang sihat.
              </p>
            </div>

            {/* Global Date & Filter Bar (Only visible on relevant pages) */}
            {(activeTab === "dashboard" || activeTab === "r1" || activeTab === "r2" || activeTab === "r3") && (
              <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold px-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Penapis:</span>
                </div>
                
                {/* Category Filter */}
                <select
                  value={clientCategoryFilter}
                  onChange={(e) => setClientCategoryFilter(e.target.value)}
                  className="bg-slate-50 text-slate-700 text-xs font-semibold px-2 py-1 rounded border border-slate-200"
                >
                  <option value="ALL">Semua Sektor</option>
                  <option value="GOVERNMENT">GOVERNMENT</option>
                  <option value="CORPORATE">CORPORATE</option>
                  <option value="INTERNAL">INTERNAL</option>
                </select>

                {/* PIC Filter */}
                <select
                  value={picFilter}
                  onChange={(e) => setPicFilter(e.target.value)}
                  className="bg-slate-50 text-slate-700 text-xs font-semibold px-2 py-1 rounded border border-slate-200"
                >
                  <option value="ALL">Semua PIC</option>
                  <option value="Fuzy">Fuzy</option>
                  <option value="Adila">Adila</option>
                  <option value="Suhairi">Suhairi</option>
                  <option value="Fuzi">Fuzi</option>
                </select>

                {/* Clear filters if active */}
                {(clientCategoryFilter !== "ALL" || picFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setClientCategoryFilter("ALL");
                      setPicFilter("ALL");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold px-1.5"
                  >
                    Set Semula
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SCREEN 1: 0.0 DASHBOARD UTAMA (OPERATIONAL HUB) */}
          {/* ========================================================================= */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Top KPI Cards Strip (5 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Card 1: Total Revenue (Secured / Invoiced) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Secured Revenue (R1+R3)</span>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {formatRM(stats.totalRevenueSecured)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Invoiced / PO Amount</span>
                    <span className="text-emerald-600 font-bold">In Target</span>
                  </div>
                  <div className="absolute top-0 right-0 h-1 w-full bg-blue-600" />
                </div>

                {/* Card 2: Collected Revenue (R1) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kutipan Tunai (R1)</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">
                    {formatRM(stats.collectedRevenue)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Collected Rate</span>
                    <span className="text-slate-700 font-bold">{stats.speed.toFixed(1)}%</span>
                  </div>
                  <div className="absolute top-0 right-0 h-1 w-full bg-emerald-500" />
                </div>

                {/* Card 3: Outstanding Collection (R1) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Outstanding (R1)</span>
                  <p className="text-xl font-extrabold text-rose-600 mt-1">
                    {formatRM(stats.outstandingCollection)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Kadar Belum Kutip</span>
                    <span className="text-rose-600 font-bold">{(100 - stats.speed).toFixed(1)}%</span>
                  </div>
                  <div className="absolute top-0 right-0 h-1 w-full bg-rose-500" />
                </div>

                {/* Card 4: Forecast Weighted (R3) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Forecast (R3 Funnel)</span>
                  <p className="text-xl font-extrabold text-amber-600 mt-1">
                    {formatRM(stats.forecastWeighted)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Unjuran Berwajaran</span>
                    <span className="text-amber-600 font-bold">Weighted</span>
                  </div>
                  <div className="absolute top-0 right-0 h-1 w-full bg-amber-500" />
                </div>

                {/* Card 5: Total Trained (R2) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sesi Latihan (R2)</span>
                  <p className="text-xl font-extrabold text-indigo-600 mt-1">
                    {stats.sessionsCount} <span className="text-xs font-semibold text-slate-500">Sesi</span>
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Trained Talent</span>
                    <span className="text-indigo-600 font-bold">{stats.totalTrained} Pax</span>
                  </div>
                  <div className="absolute top-0 right-0 h-1 w-full bg-indigo-500" />
                </div>

              </div>

              {/* Main Visuals & Side Widgets Layout (65% vs 35% Width) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* SECTION LEFT (65% Width) - charts */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Visual 1: Revenue vs Collection Trend */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase">Revenue vs Cash Collection Monthly</h3>
                        <p className="text-xs text-slate-500">Prestasi pengeluaran invois berbanding tunai yang masuk mengikut bulan.</p>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">R1 Real-time</span>
                    </div>
                    <RevenueTrendChart data={monthlyChartData} />
                  </div>

                  {/* Visual 2: Sales Funnel Breakdown R3 Progress */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">R3 Sales Funnel Progression Stage</h3>
                    
                    <div className="space-y-4">
                      {["LEAD_REGISTERED", "PROPOSAL_SUBMITTED", "QUOTATION_APPROVED", "PO_RECEIVED", "INVOICED", "PAID"].map((stage) => {
                        const count = programsList.filter((p) => p.currentStage === stage).length;
                        const pct = (count / programsList.length) * 100 || 0;
                        const labelMap: Record<string, string> = {
                          LEAD_REGISTERED: "1. Lead Registered (Pendaftaran R3)",
                          PROPOSAL_SUBMITTED: "2. Proposal Submitted (Pembentangan Kertas)",
                          QUOTATION_APPROVED: "3. Quotation Approved (Sebut Harga Lulus)",
                          PO_RECEIVED: "4. PO Received (Penerimaan Tempahan)",
                          INVOICED: "5. Invoiced (Invois Keluar R1)",
                          PAID: "6. Paid (Hasil Berjaya Dikutip R1)",
                        };
                        return (
                          <div key={stage} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span>{labelMap[stage]}</span>
                              <span>{count} Program ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.max(5, pct)}%` }}
                                className="bg-blue-600 h-full rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* SECTION RIGHT (35% Width) */}
                <div className="space-y-6">
                  
                  {/* Widget: ACTION REQUIRED TODAY (Top 5) */}
                  <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-1 bg-red-600" />
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1.5 text-red-600">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <h3 className="text-sm font-bold uppercase tracking-tight">Tindakan Segera Hari Ini</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab("action_center")}
                        className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center space-x-1"
                      >
                        <span>Lihat Semua ({stats.totalAlerts})</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 mb-4">
                      Terdapat {stats.totalAlerts} isu dikesan yang berisiko menyebabkan kebocoran hasil. Sila ambil tindakan segera!
                    </p>

                    <div className="space-y-3">
                      {programsList
                        .filter((p) => p.hasActionRequired)
                        .slice(0, 5)
                        .map((p) => (
                          <div
                            key={p.programId}
                            onClick={() => {
                              setSelectedProgramId(p.programId);
                              setActiveTab("program_360");
                              addToast(`Memaparkan Program 360°: ${p.programId}`, "info");
                            }}
                            className="p-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold text-slate-500">{p.programId}</span>
                              <span className="text-[9px] font-bold uppercase text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                                KRITIKAL
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 mt-1 truncate">{p.programTitle}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{p.clientName}</p>
                            
                            <div className="mt-2 text-[10px] text-rose-700 font-semibold bg-rose-50/50 p-1.5 rounded border border-rose-100 flex items-start space-x-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <span className="leading-tight truncate">{p.actionRequiredReason?.split(",")[0]}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Widget: Upcoming Training Session Calendar (R2) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 uppercase mb-3">Sesi Latihan R2 Akan Datang (7 Hari)</h3>
                    
                    <div className="space-y-3">
                      {programsList
                        .filter((p) => p.r2Status === "UPCOMING" || p.r2Status === "PENDING_DATA")
                        .slice(0, 3)
                        .map((p) => (
                          <div key={p.programId} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{p.programTitle}</p>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{p.trainingStartDate || "Belum Dijadual"}</span>
                                </span>
                                <span>•</span>
                                <span className="font-bold text-slate-700">{p.picName}</span>
                              </div>
                            </div>
                            <ChevronRight
                              onClick={() => {
                                setSelectedProgramId(p.programId);
                                setActiveTab("program_360");
                              }}
                              className="w-4 h-4 text-slate-400 hover:text-blue-600 cursor-pointer shrink-0 ml-2"
                            />
                          </div>
                        ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Table: Recent Chain Activities & Updates */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase">Master Rantai Data Operasi MIMOS Academy</h3>
                    <p className="text-xs text-slate-500">Senarai rantaian penuh dari status jualan hingga kutipan dan status latihan.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("import")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-extrabold flex items-center space-x-1"
                  >
                    <span>Import Lebih Banyak Rekod</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">ID & Klien</th>
                        <th className="py-2.5 px-3">Nama Program</th>
                        <th className="py-2.5 px-3">Stage Aliran</th>
                        <th className="py-2.5 px-3">Jumlah Sebut Harga (RM)</th>
                        <th className="py-2.5 px-3">Dikutip R1 (RM)</th>
                        <th className="py-2.5 px-3">Peserta R2</th>
                        <th className="py-2.5 px-3 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {filteredPrograms.slice(0, 10).map((p) => (
                        <tr key={p.programId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{p.programId}</span>
                            <span className="text-[10px] text-slate-400 block">{p.clientName}</span>
                          </td>
                          <td className="py-3 px-3 max-w-xs truncate">
                            <span className="font-semibold block">{p.programTitle}</span>
                            <span className="text-[10px] text-slate-400">PIC: {p.picName} ({p.clientCategory})</span>
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge status={p.currentStage} label={p.currentStage} />
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {formatRM(parseFloat(p.invoiceAmount) || parseFloat(p.forecastValue))}
                          </td>
                          <td className="py-3 px-3 text-emerald-600 font-bold">
                            {formatRM(parseFloat(p.amountCollected))}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{p.totalParticipants} Trained</span>
                              <span className="text-[9px] text-slate-500">Bumi: {p.bumiputeraCount} | Non-Bumi: {p.nonBumiputeraCount}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => {
                                  setSelectedProgramId(p.programId);
                                  setActiveTab("program_360");
                                }}
                                className="bg-slate-100 text-slate-800 hover:bg-blue-600 hover:text-white px-2 py-1 rounded text-[11px] font-bold"
                              >
                                View 360
                              </button>
                              {activeRole === "Super Admin" && (
                                <button
                                  onClick={() => handleDeleteProgramClick(p.programId)}
                                  className="text-rose-600 hover:text-rose-900 p-1 hover:bg-rose-50 rounded"
                                  title="Padam"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
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
          )}

          {/* ========================================================================= */}
          {/* SCREEN 2: 1.0 ACTION CENTER ("ACTION REQUIRED") [★ KEYPAGE] */}
          {/* ========================================================================= */}
          {activeTab === "action_center" && (
            <div className="space-y-6">
              
              {/* Severity Banner */}
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm">AMARAN KRITIKAL: 5 Invois Melebihi Tempoh &gt;30 Hari</h3>
                    <p className="text-xs text-red-700">Terdapat jumlah tertunggak bernilai RM 184,200.00 yang memerlukan susulan segera bersama pihak klien.</p>
                  </div>
                </div>
                <button
                  onClick={triggerPrintBoardReport}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 hidden sm:block"
                >
                  Cetak Ringkasan Kritikal
                </button>
              </div>

              {/* TAB SYSTEM */}
              <div className="flex overflow-x-auto border-b border-slate-200 pb-px gap-1 bg-white p-1 rounded-xl">
                {[
                  { id: "ALL", label: "Semua Amaran", count: stats.totalAlerts },
                  { id: "OVERDUE", label: "Invois Overdue (>30 Hari)", count: stats.criticalOverdueCount },
                  { id: "PENDING_QUO", label: "Quotation Menggantung (>14 Hari)", count: stats.pendingQuoCount },
                  { id: "MISSING_PO", label: "Missing PO Records", count: stats.missingPoCount },
                  { id: "INCOMPLETE_R2", label: "Data R2 Tidak Lengkap", count: stats.incompleteR2Count },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActionSubTab(tab.id)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center space-x-2 ${
                      actionSubTab === tab.id
                        ? "bg-slate-900 text-white"
                        : "hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      actionSubTab === tab.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-800"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* TABLE LISTING OF ACTION ITEMS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase">Senarai Semakan Kebocoran Hasil Operasi</h3>
                  <span className="text-xs text-slate-500 font-medium">Berdasarkan data audit automatik</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Prioriti</th>
                        <th className="py-2.5 px-4">Kategori Amaran</th>
                        <th className="py-2.5 px-4">Klien & Dokumen Terlibat</th>
                        <th className="py-2.5 px-4">Butiran Ralat / Isu</th>
                        <th className="py-2.5 px-4">PIC</th>
                        <th className="py-2.5 px-4 text-center">Tindakan Penyelesaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {programsList
                        .filter((p) => {
                          if (!p.hasActionRequired) return false;
                          if (actionSubTab === "OVERDUE") return p.paymentStatus === "OVERDUE";
                          if (actionSubTab === "PENDING_QUO") return p.currentStage === "PROPOSAL_SUBMITTED";
                          if (actionSubTab === "MISSING_PO") return p.currentStage === "INVOICED" && (!p.poNo || p.poNo.trim() === "");
                          if (actionSubTab === "INCOMPLETE_R2") return p.r2Status === "PENDING_DATA";
                          return true;
                        })
                        .map((p, idx) => {
                          const isHigh = p.paymentStatus === "OVERDUE" || (p.currentStage === "INVOICED" && !p.poNo);
                          return (
                            <tr key={p.programId} className="hover:bg-slate-55/50 transition-colors">
                              <td className="py-4 px-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isHigh ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}>
                                  {isHigh ? "TINGGI" : "SEDERHANA"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-slate-900 block">
                                  {p.paymentStatus === "OVERDUE" && "Invois Overdue"}
                                  {p.currentStage === "INVOICED" && !p.poNo && "Missing PO Document"}
                                  {p.currentStage === "PROPOSAL_SUBMITTED" && "Quotation Pending"}
                                  {p.r2Status === "PENDING_DATA" && "R2 Incomplete"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{p.programId}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-bold text-slate-800 block">{p.clientName}</span>
                                <span className="text-[10px] text-slate-500 block">
                                  Quo: {p.quotationNo || "Tiada"} | Inv: {p.invoiceNo || "Tiada"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="p-2 bg-rose-50/50 rounded border border-rose-100/55 max-w-sm">
                                  <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                                    {p.actionRequiredReason || "Sila lengkapkan rantaian audit program."}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-700">{p.picName}</td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  
                                  {/* Overdue Action */}
                                  {p.paymentStatus === "OVERDUE" && (
                                    <>
                                      <button
                                        onClick={() => {
                                          const amount = parseFloat(p.invoiceAmount) || 20000;
                                          handleLogPayment(p.programId, amount);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold"
                                      >
                                        Selesai Bayar
                                      </button>
                                      <button
                                        onClick={() => {
                                          alert(`[SIMULATOR] Email peringatan rasmi telah dijana & dihantar kepada PIC Kewangan ${p.clientName} berhubung Invois ${p.invoiceNo}.`);
                                          addActivityLog(p.programId, activeRole, "EMAIL_SENT", `Email susulan dihantar kepada klien mengenai invois overdue RM ${p.invoiceAmount}.`);
                                        }}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1"
                                      >
                                        <Mail className="w-3 h-3" />
                                        <span>Email</span>
                                      </button>
                                    </>
                                  )}

                                  {/* Missing PO Action */}
                                  {p.currentStage === "INVOICED" && !p.poNo && (
                                    <button
                                      onClick={() => {
                                        const po = prompt("Sila masukkan No. PO rasmi:", `PO-MIMOS-${Math.floor(1000 + Math.random() * 9000)}`);
                                        if (po) handleUploadPO(p.programId, po, p.invoiceAmount);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-bold"
                                    >
                                      Upload PO
                                    </button>
                                  )}

                                  {/* Incomplete R2 Action */}
                                  {p.r2Status === "PENDING_DATA" && (
                                    <button
                                      onClick={() => {
                                        const b = prompt("Bilangan Peserta Bumiputera:", "20");
                                        const nb = prompt("Bilangan Peserta Bukan Bumiputera:", "10");
                                        if (b !== null && nb !== null) {
                                          handleSaveR2Demographics(p.programId, parseInt(b) || 0, parseInt(nb) || 0);
                                        }
                                      }}
                                      className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[10px] font-bold"
                                    >
                                      Input R2 Demographics
                                    </button>
                                  )}

                                  {/* View 360 CRM Action */}
                                  <button
                                    onClick={() => {
                                      setSelectedProgramId(p.programId);
                                      setActiveTab("program_360");
                                    }}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded text-[10px] font-bold"
                                  >
                                    Rantai 360°
                                  </button>

                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 3: 2.0 EXECUTIVE DASHBOARD (CEO & TOP MANAGEMENT VIEW) */}
          {/* ========================================================================= */}
          {activeTab === "executive" && (
            <div className="space-y-6">
              
              {/* Executive Action Header */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">MIMOS Academy C-Level Command Center</h2>
                  <p className="text-xs text-slate-300">Skrin berimpak tinggi bertaraf Executive & Corporate Enterprise untuk keputusan strategik dalam 5 saat.</p>
                </div>
                <button
                  onClick={triggerPrintBoardReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0 shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  <span>One-Click &quot;Board Executive Report&quot; Generator</span>
                </button>
              </div>

              {/* Executive Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-black text-slate-400 uppercase">Revenue Secured</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{formatRM(stats.totalRevenueSecured)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Invoiced & secured contracts</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-black text-slate-400 uppercase">Cash Collected</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{formatRM(stats.collectedRevenue)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Nisbah Kutipan: {stats.speed.toFixed(1)}%</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-black text-slate-400 uppercase">Gross Profit Margin %</span>
                  <p className="text-2xl font-black text-blue-600 mt-1">82.5%</p>
                  <p className="text-[10px] text-slate-500 mt-1">Purata margin keuntungan latihan</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-black text-slate-400 uppercase">Pipeline Coverage</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">1.82x</p>
                  <p className="text-[10px] text-slate-500 mt-1">Nisbah unjuran berbanding sasaran</p>
                </div>

              </div>

              {/* Executive Visual Grid (Waterfall & Speedometer Gauges) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Waterfall Chart Column */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Executive Waterfall Revenue Stream</h3>
                  <p className="text-xs text-slate-400 mb-4">Mengenal pasti sekatan dan kebocoran hasil daripada peringkat unjuran R3 sehingga kutipan R1.</p>
                  <WaterfallChart data={waterfallData} />
                </div>

                {/* 2. Speedometer Gauge Column */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase mb-1">Cash Conversion Speed</h3>
                    <p className="text-xs text-slate-400">Kepantasan kutipan wang daripada invois dikeluarkan hingga bayaran diterima.</p>
                  </div>
                  <CashSpeedometer speedPercentage={stats.speed} />
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-500">REVENUE LEAKAGE RADAR</p>
                    <p className="text-lg font-black text-rose-600 mt-0.5">{formatRM(stats.outstandingCollection)}</p>
                    <p className="text-[9px] text-rose-500 font-bold">Kewangan berisiko akibat overdue &gt;30 hari</p>
                  </div>
                </div>

              </div>

              {/* National Talent and Top Clients Column */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* R2 Demographic Impact */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">R2 National Talent Impact Gauge</h3>
                  <p className="text-xs text-slate-400">Pecahan modal insan yang telah dilatih antara Bumiputera dan Bukan Bumiputera.</p>
                  <DemographicPieChart bumi={stats.totalBumi} nonBumi={stats.totalNonBumi} />
                </div>

                {/* Top Client Contribution Matrix */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Top Client Contribution Matrix</h3>
                  
                  <div className="space-y-3.5">
                    {programsList
                      .reduce((acc: any[], current) => {
                        const existing = acc.find((item) => item.clientName === current.clientName);
                        const val = parseFloat(current.invoiceAmount) || parseFloat(current.forecastValue) || 0;
                        if (existing) {
                          existing.value += val;
                        } else {
                          acc.push({ clientName: current.clientName, value: val, category: current.clientCategory });
                        }
                        return acc;
                      }, [])
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5)
                      .map((client, idx) => {
                        const totalSecured = stats.totalRevenueSecured || 1;
                        const pct = (client.value / totalSecured) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800 truncate">{client.clientName}</span>
                              <span className="font-bold text-slate-900 shrink-0">{formatRM(client.value)}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.max(3, pct)}%` }}
                                className="bg-blue-600 h-full rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 4: 3.0 R3 SALES & OPPORTUNITY FUNNEL */}
          {/* ========================================================================= */}
          {activeTab === "r3" && (
            <div className="space-y-6">
              
              {/* Sales Forecast KPI Card Panel */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Jumlah Peluang (Leads)</span>
                  <p className="text-xl font-extrabold text-slate-800 mt-0.5">
                    {programsList.filter((p) => p.currentStage === "LEAD_REGISTERED" || p.currentStage === "PROPOSAL_SUBMITTED").length} Peluang
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Forecast Unweighted (RM)</span>
                  <p className="text-xl font-extrabold text-slate-800 mt-0.5">
                    {formatRM(programsList.reduce((sum, p) => sum + parseFloat(p.forecastValue), 0))}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Forecast Weighted (RM)</span>
                  <p className="text-xl font-extrabold text-amber-600 mt-0.5">
                    {formatRM(stats.forecastWeighted)}
                  </p>
                </div>
              </div>

              {/* Kanban / Stage Board Board */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Pipeline Kanban / Stage Board</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {[
                    { id: "LEAD_REGISTERED", title: "1. Lead Registered", color: "bg-slate-100 text-slate-800 border-slate-200" },
                    { id: "PROPOSAL_SUBMITTED", title: "2. Proposal / Quo Sent", color: "bg-blue-50 text-blue-800 border-blue-200" },
                    { id: "QUOTATION_APPROVED", title: "3. Quotation Approved", color: "bg-sky-50 text-sky-800 border-sky-200" },
                    { id: "PO_RECEIVED", title: "4. PO Received", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                  ].map((column) => {
                    const colProgs = programsList.filter((p) => p.currentStage === column.id);
                    return (
                      <div key={column.id} className="bg-slate-150 p-4 rounded-xl border border-slate-200 flex flex-col h-[500px]">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${column.color}`}>
                            {column.title}
                          </span>
                          <span className="text-xs font-black text-slate-500">{colProgs.length}</span>
                        </div>

                        {/* Draggable Card Simulator area */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {colProgs.length === 0 ? (
                            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-[11px] p-4 text-center">
                              Tiada program di peringkat ini.
                            </div>
                          ) : (
                            colProgs.map((p) => (
                              <div
                                key={p.programId}
                                onClick={() => {
                                  setSelectedProgramId(p.programId);
                                  setActiveTab("program_360");
                                }}
                                className="bg-white p-3 rounded-lg shadow-xs border border-slate-200 hover:border-blue-500 cursor-pointer transition-all"
                              >
                                <div className="flex justify-between items-start text-[10px] text-slate-400">
                                  <span>{p.programId}</span>
                                  <span className="font-bold text-slate-600">{p.picName}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-800 mt-1 line-clamp-2">{p.programTitle}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{p.clientName}</p>
                                
                                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400">Prob: {(parseFloat(p.probability) * 100).toFixed(0)}%</span>
                                  <span className="font-black text-slate-800">{formatRM(parseFloat(p.forecastValue))}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 5: 4.0 QUOTATIONS */}
          {/* ========================================================================= */}
          {activeTab === "quotations" && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase">Quotation Master List (Sebut Harga)</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">Peranan PIC & Admin boleh menukar keputusan status:</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">No. Quotation</th>
                        <th className="py-2.5 px-3">Tajuk Program & Klien</th>
                        <th className="py-2.5 px-3">Nilai Sebut Harga (RM)</th>
                        <th className="py-2.5 px-3">Tarikh</th>
                        <th className="py-2.5 px-3">Status Pipeline</th>
                        <th className="py-2.5 px-3 text-center">Tindakan Keputusan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {programsList
                        .filter((p) => p.quotationNo)
                        .map((p) => (
                          <tr key={p.programId} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-bold text-blue-600 font-mono">
                              {p.quotationNo}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800 block">{p.programTitle}</span>
                              <span className="text-[10px] text-slate-400 block">{p.clientName}</span>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {formatRM(parseFloat(p.forecastValue))}
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              {p.quotationDate || "Belum Dijana"}
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={p.currentStage} />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                {p.currentStage === "PROPOSAL_SUBMITTED" && (
                                  <>
                                    <button
                                      onClick={async () => {
                                        if (!checkRBAC(["Super Admin", "PIC"], "Lulus Sebut Harga")) return;
                                        await updateProgram({
                                          programId: p.programId,
                                          currentStage: "QUOTATION_APPROVED",
                                          user: activeRole,
                                        });
                                        addToast(`Sebut Harga ${p.quotationNo} diluluskan!`, "success");
                                        refreshDb();
                                      }}
                                      className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold"
                                    >
                                      Set Setuju
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!checkRBAC(["Super Admin", "PIC"], "Tolak Sebut Harga")) return;
                                        await updateProgram({
                                          programId: p.programId,
                                          currentStage: "LEAD_REGISTERED",
                                          user: activeRole,
                                        });
                                        addToast(`Quotation ditukar semula ke peringkat Lead.`, "info");
                                        refreshDb();
                                      }}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px] font-bold"
                                    >
                                      Gagal
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedProgramId(p.programId);
                                    setActiveTab("program_360");
                                  }}
                                  className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-[10px] font-bold hover:bg-blue-50"
                                >
                                  View CRM
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 6: 5.0 PURCHASE ORDERS (PO) */}
          {/* ========================================================================= */}
          {activeTab === "pos" && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase">Purchase Order (PO) Matching Hub</h3>
                    <p className="text-xs text-slate-500">Memastikan padanan nilai rasmi di antara Sebut Harga (Quotation) dan Purchase Order (PO).</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Sebut Harga No.</th>
                        <th className="py-2.5 px-3">PO Rasmi No.</th>
                        <th className="py-2.5 px-3">Klien & Program</th>
                        <th className="py-2.5 px-3">Nilai Sebut Harga (RM)</th>
                        <th className="py-2.5 px-3">Nilai PO (RM)</th>
                        <th className="py-2.5 px-3">Status Padanan (Matching)</th>
                        <th className="py-2.5 px-3 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {programsList
                        .filter((p) => p.quotationNo)
                        .map((p) => {
                          const quoVal = parseFloat(p.forecastValue) || 0;
                          const poVal = parseFloat(p.poAmount) || 0;
                          const hasPo = p.poNo && p.poNo.trim() !== "";
                          const matches = hasPo && quoVal === poVal;

                          return (
                            <tr key={p.programId} className="hover:bg-slate-55/50">
                              <td className="py-3 px-3 font-semibold text-slate-500">{p.quotationNo}</td>
                              <td className="py-3 px-3">
                                {hasPo ? (
                                  <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">{p.poNo}</span>
                                ) : (
                                  <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">MISSING PO</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-800 block">{p.clientName}</span>
                                <span className="text-[10px] text-slate-400 block">{p.programTitle}</span>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-700">{formatRM(quoVal)}</td>
                              <td className="py-3 px-3 font-bold text-slate-700">
                                {hasPo ? formatRM(poVal) : "RM 0.00"}
                              </td>
                              <td className="py-3 px-3">
                                {hasPo ? (
                                  matches ? (
                                    <span className="inline-flex items-center text-emerald-600 font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                      ✓ MATCHED PERFECT
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-rose-600 font-bold text-[10px] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                                      ⚠ MISMATCH DETECTED
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center text-amber-600 font-bold text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    PENDING UPLOAD
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {!hasPo ? (
                                  <button
                                    onClick={() => {
                                      const po = prompt("Sila masukkan No. PO rasmi:", `PO-MIMOS-${Math.floor(1000 + Math.random() * 9000)}`);
                                      if (po) handleUploadPO(p.programId, po, p.forecastValue);
                                    }}
                                    className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold"
                                  >
                                    Kemaskini PO
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedProgramId(p.programId);
                                      setActiveTab("program_360");
                                    }}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded text-[10px] font-bold"
                                  >
                                    Urus
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 7: 6.0 R1 FINANCIALS (INVOICES & AGING) */}
          {/* ========================================================================= */}
          {activeTab === "r1" && (
            <div className="space-y-6">
              
              {/* Financial Aging Analysis Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Hasil Berjaya Dikutip (Paid)</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">
                    {formatRM(programsList.reduce((sum, p) => sum + parseFloat(p.amountCollected), 0))}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Siri Aging 1 - 30 Hari</span>
                  <p className="text-xl font-extrabold text-blue-600 mt-1">
                    {formatRM(programsList.filter((p) => p.daysOutstanding > 0 && p.daysOutstanding <= 30 && p.paymentStatus !== "PAID").reduce((sum, p) => sum + parseFloat(p.outstandingBalance), 0))}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Siri Aging 31 - 60 Hari</span>
                  <p className="text-xl font-extrabold text-amber-500 mt-1">
                    {formatRM(programsList.filter((p) => p.daysOutstanding > 30 && p.daysOutstanding <= 60 && p.paymentStatus !== "PAID").reduce((sum, p) => sum + parseFloat(p.outstandingBalance), 0))}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center animate-pulse">
                  <span className="text-[10px] text-slate-400 font-bold uppercase text-red-600">Siri Aging 61+ Hari (KRITIKAL)</span>
                  <p className="text-xl font-extrabold text-rose-600 mt-1">
                    {formatRM(programsList.filter((p) => p.daysOutstanding > 60 && p.paymentStatus !== "PAID").reduce((sum, p) => sum + parseFloat(p.outstandingBalance), 0))}
                  </p>
                </div>

              </div>

              {/* Outstanding Invoices List */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">Pengurusan Invois & Siri Aging Hasil</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">No. Invois</th>
                        <th className="py-2.5 px-3">Klien & Tajuk Latihan</th>
                        <th className="py-2.5 px-3">Nilai Invois (RM)</th>
                        <th className="py-2.5 px-3">SST (8%) (RM)</th>
                        <th className="py-2.5 px-3">Telah Dibayar (RM)</th>
                        <th className="py-2.5 px-3">Hari Aging (Outstanding)</th>
                        <th className="py-2.5 px-3">Status Kutipan</th>
                        <th className="py-2.5 px-3 text-center">Tindakan Kutipan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {programsList
                        .filter((p) => p.invoiceNo)
                        .map((p) => {
                          const outstanding = parseFloat(p.outstandingBalance) || 0;
                          return (
                            <tr key={p.programId} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 font-bold font-mono text-slate-800">{p.invoiceNo}</td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-800 block">{p.clientName}</span>
                                <span className="text-[10px] text-slate-400 block">{p.programTitle}</span>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900">{formatRM(parseFloat(p.invoiceAmount))}</td>
                              <td className="py-3 px-3 text-slate-500">{formatRM(parseFloat(p.sstAmount))}</td>
                              <td className="py-3 px-3 text-emerald-600 font-bold">{formatRM(parseFloat(p.amountCollected))}</td>
                              <td className="py-3 px-3">
                                {outstanding > 0 ? (
                                  <span className={`inline-block px-2 py-0.5 rounded font-black ${
                                    p.daysOutstanding > 30 ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                                  }`}>
                                    {p.daysOutstanding} Hari
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-semibold">Terselaras</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <StatusBadge status={p.paymentStatus} />
                              </td>
                              <td className="py-3 px-3 text-center">
                                {outstanding > 0 ? (
                                  <button
                                    onClick={() => {
                                      handleLogPayment(p.programId, outstanding);
                                    }}
                                    className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold"
                                  >
                                    Log Kutip RM {outstanding.toLocaleString()}
                                  </button>
                                ) : (
                                  <span className="text-emerald-600 font-black">Lunas</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 8: 7.0 R2 TRAINING MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === "r2" && (
            <div className="space-y-6">
              
              {/* Participant Demographic Bar metrics */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Jumlah Modal Insan Dilatih</h3>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalTrained} Pax</p>
                  <p className="text-[10px] text-slate-500 mt-1">Siri pencapaian tahun semasa</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Pecahan Bumiputera</h3>
                  <p className="text-2xl font-black text-blue-600 mt-1">
                    {stats.totalBumi} Pax <span className="text-xs font-semibold text-slate-400">({((stats.totalBumi / (stats.totalTrained || 1)) * 100).toFixed(0)}%)</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Pembiayaan dana kebangsaan</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase">Bukan Bumiputera</h3>
                  <p className="text-2xl font-black text-slate-700 mt-1">
                    {stats.totalNonBumi} Pax <span className="text-xs font-semibold text-slate-400">({((stats.totalNonBumi / (stats.totalTrained || 1)) * 100).toFixed(0)}%)</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Sektor korporat & awam</p>
                </div>
              </div>

              {/* R2 Program Catalog Table */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase mb-4">MIMOS Academy R2 Training Directory</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">ID Program</th>
                        <th className="py-2.5 px-3">Tajuk Latihan & Klien</th>
                        <th className="py-2.5 px-3">Tarikh Latihan (Start / End)</th>
                        <th className="py-2.5 px-3">Jumlah Peserta</th>
                        <th className="py-2.5 px-3">Pecahan Demografi (Bumi / Non-Bumi)</th>
                        <th className="py-2.5 px-3">Status R2</th>
                        <th className="py-2.5 px-3 text-center">Tindakan Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {programsList
                        .filter((p) => p.trainingStartDate)
                        .map((p) => (
                          <tr key={p.programId} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-bold text-slate-700 font-mono">{p.programId}</td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800 block">{p.programTitle}</span>
                              <span className="text-[10px] text-slate-400 block">{p.clientName}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[11px]">
                              {p.trainingStartDate} hingga {p.trainingEndDate}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">{p.totalParticipants} Pax</td>
                            <td className="py-3 px-3">
                              {p.r2Status === "PENDING_DATA" ? (
                                <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                  DATA TIDAK LENGKAP
                                </span>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className="text-blue-600 font-bold">Bumi: {p.bumiputeraCount}</span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-slate-700">Non-Bumi: {p.nonBumiputeraCount}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={p.r2Status} />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => {
                                  const b = prompt(`Kemas kini Peserta Bumiputera untuk ${p.programId}:`, p.bumiputeraCount.toString());
                                  const nb = prompt(`Kemas kini Peserta Bukan Bumiputera untuk ${p.programId}:`, p.nonBumiputeraCount.toString());
                                  if (b !== null && nb !== null) {
                                    handleSaveR2Demographics(p.programId, parseInt(b) || 0, parseInt(nb) || 0);
                                  }
                                }}
                                className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded text-[11px] font-bold hover:bg-slate-200"
                              >
                                Edit Demographics
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 9: 8.0 PROGRAM 360° VIEW (CRM UNIFIED PAGE) [★ KEYPAGE] */}
          {/* ========================================================================= */}
          {activeTab === "program_360" && (
            <div className="space-y-6">
              
              {/* Back button and Selector strip */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0 bg-white p-4 rounded-xl border border-slate-200">
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    addToast("Kembali ke Dashboard Utama.", "info");
                  }}
                  className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Pusat Operasi</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500">Pilih Program Lain:</span>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className="bg-slate-50 text-slate-800 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none"
                  >
                    {programsList.map((p) => (
                      <option key={p.programId} value={p.programId}>
                        {p.programId} - {p.clientName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedProgramData ? (
                <>
                  {/* HEADER CARD of unified Truth */}
                  <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-2 bg-blue-600" />
                    
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <span className="bg-blue-600 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded">
                          {selectedProgramData.program.clientCategory} Sektor
                        </span>
                        <h2 className="text-xl font-extrabold mt-2.5 text-white tracking-tight">
                          {selectedProgramData.program.programTitle}
                        </h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-300">
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-100">{selectedProgramData.program.clientName}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center space-x-1.5">
                            <UserCog className="w-3.5 h-3.5 text-slate-400" />
                            <span>PIC Utama: <span className="font-bold text-slate-100">{selectedProgramData.program.picName}</span></span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center space-x-1.5">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            <span>ID: <span className="font-mono text-slate-100">{selectedProgramData.program.programId}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left md:text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Aliran Global</span>
                        <div className="mt-1">
                          <StatusBadge status={selectedProgramData.program.currentStage} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Daftar Pada: {selectedProgramData.program.leadDate || "2026-01-01"}</p>
                      </div>
                    </div>
                  </div>

                  {/* VISUAL CHAIN PROGRESS TRACKER (Stepper Component) */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">End-to-End Business Chain Tracker</h3>
                    <ChainStepper
                      steps={[
                        {
                          id: "lead",
                          label: "Lead Registered",
                          date: selectedProgramData.program.leadDate || "Jan 12",
                          status: "completed"
                        },
                        {
                          id: "quo",
                          label: "Quotation Approved",
                          date: selectedProgramData.program.quotationNo ? "Approved" : "Pending",
                          status: selectedProgramData.program.quotationNo ? "completed" : "current"
                        },
                        {
                          id: "po",
                          label: "PO Received",
                          date: selectedProgramData.program.poNo ? selectedProgramData.program.poNo : "Missing PO",
                          status: selectedProgramData.program.poNo ? "completed" : (selectedProgramData.program.currentStage === "INVOICED" ? "error" : "upcoming")
                        },
                        {
                          id: "inv",
                          label: "Invoiced Issued",
                          date: selectedProgramData.program.invoiceNo ? selectedProgramData.program.invoiceNo : "Pending",
                          status: selectedProgramData.program.invoiceNo ? "completed" : "upcoming"
                        },
                        {
                          id: "pay",
                          label: "Payment Collected",
                          date: selectedProgramData.program.paymentStatus === "PAID" ? "Settled" : "Pending RM " + parseFloat(selectedProgramData.program.outstandingBalance).toLocaleString(),
                          status: selectedProgramData.program.paymentStatus === "PAID" ? "completed" : (selectedProgramData.program.paymentStatus === "OVERDUE" ? "error" : "upcoming")
                        },
                        {
                          id: "training",
                          label: "Training Done",
                          date: selectedProgramData.program.r2Status === "COMPLETED" ? "Completed" : "Upcoming",
                          status: selectedProgramData.program.r2Status === "COMPLETED" ? "completed" : "upcoming"
                        }
                      ]}
                    />
                  </div>

                  {/* Financial, Contacts & activity log details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column (60% Width) */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Detailed Financial Breakdown */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900 uppercase mb-4 pb-2 border-b border-slate-100">Financial Chain Detail</h3>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Nilai Cadangan Jualan</span>
                            <p className="text-sm font-black text-slate-800 mt-1">RM {parseFloat(selectedProgramData.program.forecastValue).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">No. Sebut Harga (Quo)</span>
                            <p className="text-sm font-black text-slate-800 mt-1 font-mono">{selectedProgramData.program.quotationNo || "Belum Terbit"}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Nilai PO Diterima</span>
                            <p className="text-sm font-black text-slate-800 mt-1">RM {parseFloat(selectedProgramData.program.poAmount).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">No. Invois R1</span>
                            <p className="text-sm font-black text-slate-800 mt-1 font-mono">{selectedProgramData.program.invoiceNo || "Belum Terbit"}</p>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-lg">
                            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Amaun Dikutip (Cash)</span>
                            <p className="text-sm font-black text-emerald-800 mt-1">RM {parseFloat(selectedProgramData.program.amountCollected).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-rose-50 rounded-lg">
                            <span className="text-[10px] text-rose-700 font-bold uppercase block">Baki Belum Dikutip</span>
                            <p className="text-sm font-black text-rose-800 mt-1 font-mono">RM {parseFloat(selectedProgramData.program.outstandingBalance).toLocaleString()}</p>
                          </div>
                        </div>

                        {selectedProgramData.program.hasActionRequired && (
                          <div className="mt-4 p-3.5 bg-rose-50 rounded-lg border border-rose-150 flex items-start space-x-2 text-rose-800 text-xs">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Isu Dikesan:</p>
                              <p className="leading-relaxed mt-0.5">{selectedProgramData.program.actionRequiredReason}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Participant roster details */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900 uppercase mb-3 pb-2 border-b border-slate-100">R2 Delivery & Participant Demographics</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 font-bold uppercase">Urusan Sesi Latihan</p>
                            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
                              <p className="flex justify-between">
                                <span className="text-slate-400">Tarikh Mula:</span>
                                <span className="font-bold text-slate-800">{selectedProgramData.program.trainingStartDate || "Belum Ditetapkan"}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-400">Tarikh Tamat:</span>
                                <span className="font-bold text-slate-800">{selectedProgramData.program.trainingEndDate || "Belum Ditetapkan"}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-400">Status Penyampaian R2:</span>
                                <span className="font-bold text-slate-800">{selectedProgramData.program.r2Status}</span>
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 font-bold uppercase">Data Pecahan Modal Insan</p>
                            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
                              <p className="flex justify-between">
                                <span className="text-slate-400">Jumlah Peserta:</span>
                                <span className="font-bold text-slate-800">{selectedProgramData.program.totalParticipants} Orang</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-400">Bumiputera:</span>
                                <span className="font-bold text-blue-600">{selectedProgramData.program.bumiputeraCount} Orang</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-400">Bukan Bumiputera:</span>
                                <span className="font-bold text-slate-700">{selectedProgramData.program.nonBumiputeraCount} Orang</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Right Column (40% Width) */}
                    <div className="space-y-6">
                      
                      {/* Client contacts */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900 uppercase mb-3">Client Contact Profile</h3>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400 font-bold">Klien Korporat / Awam</span>
                            <p className="font-bold text-slate-800">{selectedProgramData.program.clientName}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">Sektor</span>
                            <p className="font-semibold text-slate-700">{selectedProgramData.program.clientCategory}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">PIC Klien</span>
                            <p className="font-semibold text-slate-800">Pegawai Projek Kewangan Klien</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions Panel */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900 uppercase mb-3">Quick CRM Actions</h3>
                        
                        <div className="space-y-2">
                          
                          {/* Log payment received */}
                          <button
                            onClick={() => {
                              const amount = prompt("Sila masukkan amaun bayaran tunai diterima (RM):", selectedProgramData.program.outstandingBalance);
                              if (amount) handleLogPayment(selectedProgramData.program.programId, parseFloat(amount) || 0);
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg text-center cursor-pointer"
                          >
                            Log Payment Received
                          </button>

                          {/* Upload R2 demographic data */}
                          <button
                            onClick={() => {
                              const b = prompt("Bilangan Peserta Bumiputera:", selectedProgramData.program.bumiputeraCount.toString());
                              const nb = prompt("Bilangan Peserta Bukan Bumiputera:", selectedProgramData.program.nonBumiputeraCount.toString());
                              if (b !== null && nb !== null) {
                                handleSaveR2Demographics(selectedProgramData.program.programId, parseInt(b) || 0, parseInt(nb) || 0);
                              }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg text-center cursor-pointer"
                          >
                            Kemas kini Demografi R2
                          </button>

                          {/* Trigger manual email reminder */}
                          <button
                            onClick={() => {
                              alert(`[SIMULATOR] Email susulan telah dijana & dihantar secara simulasi kepada PIC Kewangan ${selectedProgramData.program.clientName} bagi ID ${selectedProgramData.program.programId}.`);
                              addActivityLog(selectedProgramData.program.programId, activeRole, "EMAIL_SENT", "Email reminder manual dihantar mengenai status kewangan.");
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-3 rounded-lg text-center cursor-pointer"
                          >
                            Hantar Email Reminder
                          </button>

                        </div>
                      </div>

                      {/* Audit & Activity History */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900 uppercase mb-3">Audit & Activity History</h3>
                        
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                          {selectedProgramData.logs.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">Tiada sejarah tindakan dikesan.</p>
                          ) : (
                            selectedProgramData.logs.map((log: any) => (
                              <div key={log.id} className="relative pl-5 pb-1">
                                <div className="absolute top-1.5 left-0 w-2 h-2 rounded-full bg-blue-600" />
                                <div className="text-[11px] text-slate-400 font-bold">
                                  {new Date(log.activityDate).toLocaleString("en-MY", { hour12: false })} | Oleh {log.userName}
                                </div>
                                <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-relaxed">{log.description}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                </>
              ) : (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <p className="text-slate-400 text-sm">Sedang memuatkan data unified 360...</p>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 10: 10.0 IMPORT CENTER (EXCEL INGESTION & RECONCILIATION) */}
          {/* ========================================================================= */}
          {activeTab === "import" && (
            <div className="space-y-6">
              
              {/* Drag and Drop Zone and instructions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Excel Ingestion Ingestor (R1, R2, R3 Spreadsheet Parser)</h3>
                <p className="text-xs text-slate-500 mb-4">Muat naik hamparan rasmi Excel dari Jabatan Kewangan atau Portal Latihan untuk diselaraskan ke sistem MIMOS secara automatik.</p>
                
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-blue-50/20 transition-all flex flex-col items-center justify-center">
                  <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-sm font-bold text-slate-700">MIMOS_ACADEMY_SPREADSHEET_2026.XLSX</p>
                  <p className="text-xs text-slate-400 mt-1">Sokongan: .XLSX, .XLS, .CSV sehingga 50MB</p>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        alert("[SIMULATOR] Memuat turun Master Excel Template MIMOS Academy v1.0.0...");
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 cursor-pointer"
                    >
                      Download Master Excel Template
                    </button>
                    <button
                      onClick={handleSimulateExcelImport}
                      disabled={isParsing}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isParsing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyaring...</span>
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Simulasikan Import Fail Excel</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Pipeline validation checklist logs */}
              {importLogs.length > 0 && (
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed space-y-1">
                  <p className="text-blue-400 font-bold">PIPELINE LOGS VERIFICATION CHECKLIST:</p>
                  {importLogs.map((log, idx) => (
                    <p key={idx}>{log}</p>
                  ))}
                </div>
              )}

              {/* Error Reconciliation Table with Inline Fix */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-150">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase">Error Reconciliation & Preview Table</h3>
                    <p className="text-xs text-slate-400">Pinda baris draf dikesan ralat di bawah sebelum menekan import rasmi.</p>
                  </div>
                  <span className="text-xs text-slate-500 font-bold">3 Draf Terhasil</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Nama Program (Preview)</th>
                        <th className="py-2.5 px-3">Nama Klien (Ralat & Alias)</th>
                        <th className="py-2.5 px-3">Nilai (RM)</th>
                        <th className="py-2.5 px-3">PO No. (Simulasi Ralat)</th>
                        <th className="py-2.5 px-3">R2 Bumi Count (Pecahan)</th>
                        <th className="py-2.5 px-3">Penyelesaian Ralat Terus (Inline Fix)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {excelRowsSim.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-55/40">
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={row.programTitle}
                              onChange={(e) => handleInlineFixRow(idx, "programTitle", e.target.value)}
                              className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs w-full text-slate-800 font-semibold"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={row.clientName}
                              onChange={(e) => handleInlineFixRow(idx, "clientName", e.target.value)}
                              className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs w-full font-bold text-slate-800"
                            />
                            <div className="text-[9px] text-amber-600 mt-1 font-bold">
                              {row.clientName === "Tenaga Nasional ILSAS" && "✓ Akan diselaras ke 'TNB ILSAS'"}
                              {row.clientName === "MB" && "✓ Akan diselaras ke 'MIMOS'"}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={row.forecastValue}
                              onChange={(e) => handleInlineFixRow(idx, "forecastValue", e.target.value)}
                              className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs w-24 text-slate-800 font-bold"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={row.poNo}
                              placeholder="KOSONG (Tiada PO)"
                              onChange={(e) => handleInlineFixRow(idx, "poNo", e.target.value)}
                              className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs w-28 text-slate-800"
                            />
                            {!row.poNo && (
                              <span className="text-[9px] text-rose-600 block mt-1 font-bold">⚠ Flag Missing PO</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              value={row.bumiputeraCount}
                              onChange={(e) => handleInlineFixRow(idx, "bumiputeraCount", e.target.value)}
                              className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs w-16 text-slate-800"
                            />
                            {parseInt(row.bumiputeraCount) === 0 && (
                              <span className="text-[9px] text-rose-600 block mt-1 font-bold">⚠ Missing R2 Data</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                handleInlineFixRow(idx, "poNo", "PO-RECON-991");
                                handleInlineFixRow(idx, "bumiputeraCount", "20");
                                handleInlineFixRow(idx, "nonBumiputeraCount", "5");
                              }}
                              className="bg-slate-900 text-white hover:bg-slate-800 px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Auto Fix Row
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 11: 10.4 DATA QUALITY AUDIT CENTER */}
          {/* ========================================================================= */}
          {activeTab === "data_quality" && (
            <div className="space-y-6">
              
              {/* Data Mismatch Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600" />
                  <div className="flex items-center space-x-2 text-rose-700">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-xs uppercase">Ralat Invois vs Bayaran R1</h3>
                  </div>
                  <p className="text-xl font-extrabold text-slate-900 mt-2">1 Mismatch</p>
                  <p className="text-xs text-slate-500 mt-1">Petunjuk bayaran berbeza antara R1 Ledger & Invoice Tracker.</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
                  <div className="flex items-center space-x-2 text-amber-700">
                    <Building className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-xs uppercase">Alias Entiti Klien Baru</h3>
                  </div>
                  <p className="text-xl font-extrabold text-slate-900 mt-2">{aliasesList.length} Alias Berdaftar</p>
                  <p className="text-xs text-slate-500 mt-1">Menggabungkan alias seperti &quot;MB&quot; ke master &quot;MIMOS&quot;.</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />
                  <div className="flex items-center space-x-2 text-blue-700">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-xs uppercase">Rantaian Identiti Pendua</h3>
                  </div>
                  <p className="text-xl font-extrabold text-slate-900 mt-2">0 Duplikasi</p>
                  <p className="text-xs text-slate-500 mt-1">Sistem menghalang pendua melalui idempotent hash key.</p>
                </div>

              </div>

              {/* Master Company Alias Dictionary Manager */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Dictionary List */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Master Company Account Alias Dictionary</h3>
                  <p className="text-xs text-slate-400 mb-4">Senarai pemetaan perkataan singkatan nama agensi / syarikat bagi penyelarasan laporan C-Level.</p>
                  
                  <div className="overflow-y-auto max-h-96 pr-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                          <th className="py-2 px-1">Alias Syarikat / Ringkasan</th>
                          <th className="py-2 px-1">Entiti Klien Rasmi (Master Account)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {aliasesList.map((alias) => (
                          <tr key={alias.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-1 font-semibold text-slate-800">{alias.aliasName}</td>
                            <td className="py-2.5 px-1 font-bold text-blue-600">{alias.masterClientName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Alias Form */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Daftarkan Alias Pemetaan Baru</h3>
                  <p className="text-xs text-slate-400 mb-4">Merapatkan jurang kepelbagaian nama klien dalam rekod Excel.</p>
                  
                  <form onSubmit={handleAddAliasSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Singkatan Alias Nama Klien (cth: TNB ILSAS Berhad)</label>
                      <input
                        type="text"
                        placeholder="Masukkan nama dikesan dalam Excel"
                        value={newAliasName}
                        onChange={(e) => setNewAliasName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-bold block mb-1">Entiti Master Akaun Utama (cth: TNB ILSAS)</label>
                      <input
                        type="text"
                        placeholder="Masukkan nama rujukan rasmi MIMOS"
                        value={newAliasMaster}
                        onChange={(e) => setNewAliasMaster(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-semibold"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold py-2.5 px-4 rounded-lg w-full cursor-pointer"
                    >
                      Daftar dan Segarkan Alias
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 12: 11.0 USERS & ROLES */}
          {/* ========================================================================= */}
          {activeTab === "rbac" && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Role-Based Access Control (RBAC) Settings Simulator</h3>
                <p className="text-xs text-slate-400 mb-6">Pilih peranan simulasi anda di bahagian kanan atas menu bar untuk merasai sekatan kawalan keselamatan sistem.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    {
                      role: "Super Admin",
                      desc: "Kuasa penuh sistem untuk mencipta, memadam, meluluskan, mengimport, mengemaskini, dan menetapkan sistem alias.",
                      permissions: ["Tambah Rekod", "Ubah Stage", "Selesai Bayaran", "Excel Ingestor", "Padam Rekod", "Urus Tetapan"]
                    },
                    {
                      role: "PIC Program",
                      desc: "Tumpuan kepada kemasukan data latihan (R2), susulan maklum balas, memuat naik dokumen, dan menyemak sebut harga sendiri.",
                      permissions: ["Tambah Rekod", "Ubah Stage", "Kemas kini R2 Demographics", "Buka Sebut Harga"]
                    },
                    {
                      role: "Management",
                      desc: "Paparan khas bertaraf CEO / C-Suite. Memiliki akses penuh melihat laporan eksekutif dan mengeksport Board Report.",
                      permissions: ["Executive Waterfall", "Cetak Board Pack", "Lihat KPI Revenue Leakage", "Gunakan Carian Cmd+K"]
                    },
                    {
                      role: "Viewer",
                      desc: "Akses lihat sahaja (Read-Only) merentas semua bahagian sistem tanpa hak melakukan sebarang modifikasi data.",
                      permissions: ["Lihat Sahaja", "Tiada Hak Edit"]
                    }
                  ].map((item) => (
                    <div
                      key={item.role}
                      className={`p-4 rounded-xl border transition-all ${
                        activeRole === item.role
                          ? "bg-blue-50/50 border-blue-500 ring-2 ring-blue-100"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <h4 className="font-extrabold text-sm text-slate-900">{item.role}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed min-h-16">{item.desc}</p>
                      
                      <div className="mt-4 pt-3 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Kebenaran Dibolehkan:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.permissions.map((p) => (
                            <span key={p} className="bg-slate-200/70 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              ✓ {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 13: 11.2 SETTINGS & MAPPING */}
          {/* ========================================================================= */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">MIMOS Business Chain Stage Mapping Rules</h3>
                <p className="text-xs text-slate-400 mb-4">Mengekod peraturan bagi triggers makluman ralat secara automatik bagi rantaian Opportunity-to-Cash.</p>
                
                <div className="space-y-4 text-xs font-semibold text-slate-700">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">Peraturan #1: Amaran Overdue Kewangan R1</p>
                    <p className="text-slate-500 font-medium mt-1">
                      Setiap invois yang dikeluarkan bertatus <span className="text-slate-800 font-bold">UNPAID</span> melebihi <span className="text-red-600 font-bold">30 hari</span> akan ditandakan dengan bendera kemas kini amaran kritikal di Action Center.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">Peraturan #2: Amaran Kelewatan Sebut Harga R3</p>
                    <p className="text-slate-500 font-medium mt-1">
                      Setiap cadangan kertas kerja yang diwujudkan bertatus <span className="text-slate-800 font-bold">PROPOSAL_SUBMITTED</span> melebihi <span className="text-amber-600 font-bold">14 hari</span> tanpa kelulusan akan diberi status susulan required.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">Peraturan #3: Amaran Latihan R2 Tidak Lengkap</p>
                    <p className="text-slate-500 font-medium mt-1">
                      Setiap sesi latihan yang tarikh selesainya telah berlalu (past date) tetapi memiliki data bilangan penyertaan Bumiputera atau Bukan Bumiputera bersamaan dengan <span className="text-red-600 font-bold">0</span> akan memaksa amaran R2.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* --- ADD NEW PROGRAM MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wide">Daftar Rekod Program R1/R2/R3 Baru</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="p-6 overflow-y-auto space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Tajuk Program Latihan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: AWS Cloud Practitioner Cohort 1"
                    value={addForm.programTitle}
                    onChange={(e) => setAddForm({ ...addForm, programTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Nama Organisasi / Klien</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: MINDEF, TNB ILSAS, LHDN"
                    value={addForm.clientName}
                    onChange={(e) => setAddForm({ ...addForm, clientName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Sektor Klien</label>
                  <select
                    value={addForm.clientCategory}
                    onChange={(e) => setAddForm({ ...addForm, clientCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="GOVERNMENT">GOVERNMENT (Kerajaan)</option>
                    <option value="CORPORATE">CORPORATE (Swasta)</option>
                    <option value="INTERNAL">INTERNAL (MIMOS)</option>
                    <option value="FOC">FOC (Bantuan Percuma)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">PIC MIMOS Academy</label>
                  <select
                    value={addForm.picName}
                    onChange={(e) => setAddForm({ ...addForm, picName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="Fuzy">Fuzy</option>
                    <option value="Adila">Adila</option>
                    <option value="Suhairi">Suhairi</option>
                    <option value="Fuzi">Fuzi</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Peringkat Pipeline</label>
                  <select
                    value={addForm.currentStage}
                    onChange={(e) => setAddForm({ ...addForm, currentStage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-bold text-blue-600"
                  >
                    <option value="LEAD_REGISTERED">1. LEAD_REGISTERED</option>
                    <option value="PROPOSAL_SUBMITTED">2. PROPOSAL_SUBMITTED</option>
                    <option value="QUOTATION_APPROVED">3. QUOTATION_APPROVED</option>
                    <option value="PO_RECEIVED">4. PO_RECEIVED</option>
                    <option value="INVOICED">5. INVOICED</option>
                    <option value="PAID">6. PAID</option>
                    <option value="TRAINING_COMPLETED">7. TRAINING_COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Nilai Cadangan Jualan (RM)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 50000"
                    value={addForm.forecastValue}
                    onChange={(e) => setAddForm({ ...addForm, forecastValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">No. Sebut Harga (Quotation No)</label>
                  <input
                    type="text"
                    placeholder="Contoh: QT-2026-0099"
                    value={addForm.quotationNo}
                    onChange={(e) => setAddForm({ ...addForm, quotationNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">No. PO Rasmi (Jika ada)</label>
                  <input
                    type="text"
                    placeholder="Contoh: PO-994821"
                    value={addForm.poNo}
                    onChange={(e) => setAddForm({ ...addForm, poNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Amaun Invois Keluar (SST Diabaikan) (RM)</label>
                  <input
                    type="number"
                    value={addForm.invoiceAmount}
                    onChange={(e) => setAddForm({ ...addForm, invoiceAmount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Jumlah Hasil Dikutip (RM)</label>
                  <input
                    type="number"
                    value={addForm.amountCollected}
                    onChange={(e) => setAddForm({ ...addForm, amountCollected: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Tarikh Mula Latihan R2</label>
                  <input
                    type="date"
                    value={addForm.trainingStartDate}
                    onChange={(e) => setAddForm({ ...addForm, trainingStartDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Tarikh Tamat Latihan R2</label>
                  <input
                    type="date"
                    value={addForm.trainingEndDate}
                    onChange={(e) => setAddForm({ ...addForm, trainingEndDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Jumlah Peserta (Total Pax)</label>
                  <input
                    type="number"
                    value={addForm.totalParticipants}
                    onChange={(e) => setAddForm({ ...addForm, totalParticipants: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Peserta Bumiputera (Bumi Count)</label>
                  <input
                    type="number"
                    value={addForm.bumiputeraCount}
                    onChange={(e) => setAddForm({ ...addForm, bumiputeraCount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 text-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Bukan Bumiputera (Non-Bumi Count)</label>
                  <input
                    type="number"
                    value={addForm.nonBumiputeraCount}
                    onChange={(e) => setAddForm({ ...addForm, nonBumiputeraCount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Hari Overdue Outstanding</label>
                  <input
                    type="number"
                    value={addForm.daysOutstanding}
                    onChange={(e) => setAddForm({ ...addForm, daysOutstanding: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  />
                </div>

              </div>

              <div className="bg-slate-100 p-3 rounded-lg text-[11px] text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-700 block">Notifikasi Audit Pintar:</span>
                Sistem akan secara automatik menilai integriti data ini mengikut SOP MIMOS Academy, termasuk menjana amaran draf jika dikesan anomali seperti Tarikh Lulus Sebut Harga atau Kutipan Overdue.
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Simpan Rekod Ke DB
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
