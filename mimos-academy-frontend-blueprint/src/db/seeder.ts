import { db } from "./index";
import { programs, activityLogs, clientAliases } from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    const existingCount = await db.select().from(programs).limit(1);
    if (existingCount.length > 0) {
      // Already seeded
      return;
    }

    console.log("Seeding database with MIMOS Academy enterprise data...");

    // 1. Predefined Critical Action Center Programs
    const criticalPrograms = [
      {
        programId: "PRG-2026-0042",
        programTitle: "Certified AI Trainer & Integration (MINDEF Cohort 1)",
        clientName: "Kementerian Pertahanan Malaysia (MINDEF)",
        clientCategory: "GOVERNMENT",
        picName: "Fuzy",
        currentStage: "INVOICED",
        leadDate: "2026-01-12",
        forecastValue: "50000.00",
        probability: "1.00",
        weightedValue: "50000.00",
        quotationNo: "QT-2026-0011",
        quotationDate: "2026-01-15",
        poNo: "PO-994821",
        poAmount: "46285.00",
        invoiceNo: "MA/INV/2026/0012",
        invoiceDate: "2026-02-05",
        invoiceAmount: "46285.00",
        sstAmount: "3702.80",
        amountCollected: "0.00",
        outstandingBalance: "46285.00",
        daysOutstanding: 52,
        paymentStatus: "OVERDUE",
        trainingStartDate: "2026-02-18",
        trainingEndDate: "2026-02-22",
        totalParticipants: 25,
        bumiputeraCount: 22,
        nonBumiputeraCount: 3,
        r2Status: "COMPLETED",
        hasActionRequired: true,
        actionRequiredReason: "Invoice Overdue > 30 Days (52 Days Outstanding)",
      },
      {
        programId: "PRG-2026-0043",
        programTitle: "Advanced Grid Cybersecurity & Smart Metering",
        clientName: "TNB ILSAS",
        clientCategory: "CORPORATE",
        picName: "Adila",
        currentStage: "INVOICED",
        leadDate: "2026-01-05",
        forecastValue: "30000.00",
        probability: "1.00",
        weightedValue: "30000.00",
        quotationNo: "QT-2026-0022",
        quotationDate: "2026-01-10",
        poNo: "", // Missing PO
        poAmount: "0.00",
        invoiceNo: "MA/INV/2026/0015",
        invoiceDate: "2026-02-10",
        invoiceAmount: "28000.00",
        sstAmount: "2240.00",
        amountCollected: "0.00",
        outstandingBalance: "28000.00",
        daysOutstanding: 45,
        paymentStatus: "OVERDUE",
        trainingStartDate: "2026-02-20",
        trainingEndDate: "2026-02-24",
        totalParticipants: 18,
        bumiputeraCount: 14,
        nonBumiputeraCount: 4,
        r2Status: "COMPLETED",
        hasActionRequired: true,
        actionRequiredReason: "Missing PO Document: Invoiced without official PO",
      },
      {
        programId: "PRG-2026-0044",
        programTitle: "Business Intelligence for Bumiputera Entrepreneurs",
        clientName: "PUNB",
        clientCategory: "GOVERNMENT",
        picName: "Suhairi",
        currentStage: "PROPOSAL_SUBMITTED",
        leadDate: "2026-02-01",
        forecastValue: "21000.00",
        probability: "0.85",
        weightedValue: "17850.00",
        quotationNo: "QT-2026-0045",
        quotationDate: "2026-02-05",
        poNo: "",
        poAmount: "0.00",
        invoiceNo: "",
        invoiceDate: "",
        invoiceAmount: "0.00",
        sstAmount: "0.00",
        amountCollected: "0.00",
        outstandingBalance: "0.00",
        daysOutstanding: 0,
        paymentStatus: "UNPAID",
        trainingStartDate: "2026-04-15",
        trainingEndDate: "2026-04-18",
        totalParticipants: 0,
        bumiputeraCount: 0,
        nonBumiputeraCount: 0,
        r2Status: "UPCOMING",
        hasActionRequired: true,
        actionRequiredReason: "Quotation Pending Approval > 14 Days",
      },
      {
        programId: "PRG-2026-0045",
        programTitle: "Generative AI Creative Workshop (Canva Cohort 2)",
        clientName: "Canva Malaysia",
        clientCategory: "CORPORATE",
        picName: "Fuzi",
        currentStage: "TRAINING_COMPLETED",
        leadDate: "2026-01-20",
        forecastValue: "15000.00",
        probability: "1.00",
        weightedValue: "15000.00",
        quotationNo: "QT-2026-0015",
        quotationDate: "2026-01-22",
        poNo: "PO-CANVA-202",
        poAmount: "15000.00",
        invoiceNo: "MA/INV/2026/0019",
        invoiceDate: "2026-03-01",
        invoiceAmount: "15000.00",
        sstAmount: "1200.00",
        amountCollected: "15000.00",
        outstandingBalance: "0.00",
        daysOutstanding: 0,
        paymentStatus: "PAID",
        trainingStartDate: "2026-03-10",
        trainingEndDate: "2026-03-12",
        totalParticipants: 30,
        bumiputeraCount: 0, // Incomplete R2 records
        nonBumiputeraCount: 0,
        r2Status: "PENDING_DATA",
        hasActionRequired: true,
        actionRequiredReason: "Incomplete R2 Records: Completed session with missing participant demographics",
      },
      {
        programId: "PRG-2026-0046",
        programTitle: "Data Science Specialization & ML Ops",
        clientName: "PETRONAS Digital",
        clientCategory: "CORPORATE",
        picName: "Adila",
        currentStage: "PAID",
        leadDate: "2025-11-02",
        forecastValue: "120000.00",
        probability: "1.00",
        weightedValue: "120000.00",
        quotationNo: "QT-2025-0988",
        quotationDate: "2025-11-10",
        poNo: "PO-PET-7722",
        poAmount: "120000.00",
        invoiceNo: "MA/INV/2025/1102",
        invoiceDate: "2025-12-01",
        invoiceAmount: "120000.00",
        sstAmount: "9600.00",
        amountCollected: "120000.00",
        outstandingBalance: "0.00",
        daysOutstanding: 0,
        paymentStatus: "PAID",
        trainingStartDate: "2026-01-15",
        trainingEndDate: "2026-01-20",
        totalParticipants: 45,
        bumiputeraCount: 30,
        nonBumiputeraCount: 15,
        r2Status: "COMPLETED",
        hasActionRequired: false,
      }
    ];

    // Seed the primary critical records
    for (const p of criticalPrograms) {
      await db.insert(programs).values(p);
    }

    // 2. Generate background programs to make up total metrics:
    // Total Revenue = 3,450,000, Collected = 2,100,000, Outstanding = 1,350,000
    // Total Forecast = 1,820,000
    // Let's seed 15 additional programs to give high density of data
    const bgPrograms = [
      {
        idSuffix: "0001",
        title: "Executive Leadership & Tech Transformation",
        client: "MIMOS Berhad",
        category: "INTERNAL",
        pic: "Fuzy",
        stage: "PAID",
        val: 500000,
        col: 500000,
        days: 0,
        status: "PAID",
        bcount: 40,
        nbcount: 10,
        r2: "COMPLETED"
      },
      {
        idSuffix: "0002",
        title: "Kubernetes & Cloud Native Architecture",
        client: "KWSP (EPF)",
        category: "GOVERNMENT",
        pic: "Suhairi",
        stage: "PAID",
        val: 450000,
        col: 450000,
        days: 0,
        status: "PAID",
        bcount: 35,
        nbcount: 15,
        r2: "COMPLETED"
      },
      {
        idSuffix: "0003",
        title: "Cyber Security Defensive Operations",
        client: "CyberSecurity Malaysia",
        category: "GOVERNMENT",
        pic: "Adila",
        stage: "PAID",
        val: 380000,
        col: 380000,
        days: 0,
        status: "PAID",
        bcount: 28,
        nbcount: 12,
        r2: "COMPLETED"
      },
      {
        idSuffix: "0004",
        title: "5G Networking & RF Planning",
        client: "Maxis Business",
        category: "CORPORATE",
        pic: "Fuzi",
        stage: "PAID",
        val: 320000,
        col: 320000,
        days: 0,
        status: "PAID",
        bcount: 12,
        nbcount: 18,
        r2: "COMPLETED"
      },
      {
        idSuffix: "0005",
        title: "AI and Deep Learning Foundations",
        client: "Intel Malaysia",
        category: "CORPORATE",
        pic: "Fuzy",
        stage: "PAID",
        val: 300000,
        col: 300000,
        days: 0,
        status: "PAID",
        bcount: 10,
        nbcount: 40,
        r2: "COMPLETED"
      },
      {
        idSuffix: "0006",
        title: "Smart Cities & IoT Middleware",
        client: "DBKL",
        category: "GOVERNMENT",
        pic: "Suhairi",
        stage: "INVOICED",
        val: 400000,
        col: 0,
        days: 45,
        status: "OVERDUE",
        bcount: 50,
        nbcount: 10,
        r2: "COMPLETED",
        action: "Invoice Overdue > 30 Days (45 Days Outstanding)"
      },
      {
        idSuffix: "0007",
        title: "Blockchain & Smart Contract Audit",
        client: "Maybank",
        category: "CORPORATE",
        pic: "Adila",
        stage: "INVOICED",
        val: 450000,
        col: 0,
        days: 62,
        status: "OVERDUE",
        bcount: 15,
        nbcount: 15,
        r2: "COMPLETED",
        action: "Invoice Overdue > 30 Days (62 Days Outstanding)"
      },
      {
        idSuffix: "0008",
        title: "Big Data & Hadoop Migration Services",
        client: "LHDN",
        category: "GOVERNMENT",
        pic: "Fuzy",
        stage: "INVOICED",
        val: 350000,
        col: 0,
        days: 15,
        status: "PARTIAL",
        bcount: 30,
        nbcount: 5,
        r2: "COMPLETED"
      },
      {
        idSuffix: "0009",
        title: "Generative AI for National Security",
        client: "MKN",
        category: "GOVERNMENT",
        pic: "Adila",
        stage: "PROPOSAL_SUBMITTED",
        val: 500000,
        prob: 0.75,
        col: 0,
        days: 0,
        status: "UNPAID",
        bcount: 0,
        nbcount: 0,
        r2: "UPCOMING"
      },
      {
        idSuffix: "0010",
        title: "IoT Edge Computing deployment",
        client: "Telekom Malaysia",
        category: "CORPORATE",
        pic: "Fuzi",
        stage: "LEAD_REGISTERED",
        val: 600000,
        prob: 0.50,
        col: 0,
        days: 0,
        status: "UNPAID",
        bcount: 0,
        nbcount: 0,
        r2: "UPCOMING"
      },
      {
        idSuffix: "0011",
        title: "Advanced DevOps & CI/CD Pipelines",
        client: "CelcomDigi",
        category: "CORPORATE",
        pic: "Suhairi",
        stage: "QUOTATION_APPROVED",
        val: 400000,
        prob: 0.90,
        col: 0,
        days: 0,
        status: "UNPAID",
        bcount: 0,
        nbcount: 0,
        r2: "UPCOMING"
      },
      {
        idSuffix: "0012",
        title: "Data Governance & Ethics Blueprint",
        client: "Sime Darby",
        category: "CORPORATE",
        pic: "Fuzy",
        stage: "PO_RECEIVED",
        val: 250000,
        prob: 0.95,
        col: 0,
        days: 0,
        status: "UNPAID",
        bcount: 0,
        nbcount: 0,
        r2: "UPCOMING"
      }
    ];

    for (let i = 0; i < bgPrograms.length; i++) {
      const bg = bgPrograms[i];
      const valNum = bg.val;
      const colNum = bg.col;
      const prob = bg.prob || 1.0;
      const weighted = valNum * prob;
      const idStr = `PRG-2026-10${bg.idSuffix}`;
      
      await db.insert(programs).values({
        programId: idStr,
        programTitle: bg.title,
        clientName: bg.client,
        clientCategory: bg.category,
        picName: bg.pic,
        currentStage: bg.stage,
        leadDate: "2026-01-25",
        forecastValue: valNum.toFixed(2),
        probability: prob.toFixed(2),
        weightedValue: weighted.toFixed(2),
        quotationNo: bg.stage !== "LEAD_REGISTERED" ? `QT-2026-10${bg.idSuffix}` : undefined,
        quotationDate: "2026-01-28",
        poNo: (bg.stage !== "LEAD_REGISTERED" && bg.stage !== "PROPOSAL_SUBMITTED") ? `PO-10${bg.idSuffix}` : undefined,
        poAmount: (bg.stage !== "LEAD_REGISTERED" && bg.stage !== "PROPOSAL_SUBMITTED") ? valNum.toFixed(2) : "0.00",
        invoiceNo: (bg.stage === "INVOICED" || bg.stage === "PAID" || bg.stage === "TRAINING_COMPLETED") ? `MA/INV/2026/10${bg.idSuffix}` : undefined,
        invoiceDate: "2026-02-12",
        invoiceAmount: valNum.toFixed(2),
        sstAmount: (valNum * 0.08).toFixed(2),
        amountCollected: colNum.toFixed(2),
        outstandingBalance: (valNum - colNum).toFixed(2),
        daysOutstanding: bg.days,
        paymentStatus: bg.status as any,
        trainingStartDate: "2026-02-25",
        trainingEndDate: "2026-02-28",
        totalParticipants: bg.bcount + bg.nbcount,
        bumiputeraCount: bg.bcount,
        nonBumiputeraCount: bg.nbcount,
        r2Status: bg.r2 as any,
        hasActionRequired: !!bg.action,
        actionRequiredReason: bg.action,
      });
    }

    // Seed Activity Logs for some items
    const logs = [
      {
        programId: "PRG-2026-0042",
        userName: "Fuzy",
        activityType: "EMAIL_SENT",
        description: "Email reminder sent to Major Azman regarding outstanding invoice (RM 46,285.00).",
      },
      {
        programId: "PRG-2026-0042",
        userName: "Fuzy",
        activityType: "MANUAL_UPDATE",
        description: "Program registered and linked with Quotation QT-2026-0011 and PO-994821.",
      },
      {
        programId: "PRG-2026-0043",
        userName: "Adila",
        activityType: "EXCEL_IMPORT",
        description: "Excel import of Invoice Tracker detected missing PO. Flagged as Missing PO escalation queue.",
      },
      {
        programId: "PRG-2026-0044",
        userName: "Suhairi",
        activityType: "EMAIL_SENT",
        description: "Quotation sent to PUNB Finance Committee. Outstanding approval >14 days.",
      }
    ];

    for (const l of logs) {
      await db.insert(activityLogs).values(l);
    }

    // Seed Company Aliases
    const aliases = [
      { aliasName: "MIMOS Berhad", masterClientName: "MIMOS" },
      { aliasName: "MIMOS", masterClientName: "MIMOS" },
      { aliasName: "MB", masterClientName: "MIMOS" },
      { aliasName: "TNB ILSAS Berhad", masterClientName: "TNB ILSAS" },
      { aliasName: "Tenaga Nasional ILSAS", masterClientName: "TNB ILSAS" },
    ];

    for (const a of aliases) {
      await db.insert(clientAliases).values(a);
    }

    console.log("Database seeded successfully with enterprise records!");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
