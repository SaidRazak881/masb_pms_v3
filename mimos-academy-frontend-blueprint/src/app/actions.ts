"use strict";

"use server";

import { db } from "@/db";
import { programs, activityLogs, clientAliases } from "@/db/schema";
import { seedDatabase } from "@/db/seeder";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface Program360Record {
  programId: string;
  programTitle: string;
  clientName: string;
  clientCategory: "GOVERNMENT" | "CORPORATE" | "INTERNAL" | "FOC";
  picName: string;
  currentStage: string;
  leadDate?: string | null;
  forecastValue: string;
  probability: string;
  weightedValue: string;
  quotationNo?: string | null;
  quotationDate?: string | null;
  poNo?: string | null;
  poAmount: string;
  invoiceNo?: string | null;
  invoiceDate?: string | null;
  invoiceAmount: string;
  sstAmount: string;
  amountCollected: string;
  outstandingBalance: string;
  daysOutstanding: number;
  paymentStatus: string;
  trainingStartDate?: string | null;
  trainingEndDate?: string | null;
  totalParticipants: number;
  bumiputeraCount: number;
  nonBumiputeraCount: number;
  r2Status: string;
  hasActionRequired: boolean;
  actionRequiredReason?: string | null;
}

// Ensure database has seeded data and fetch all records
export async function getPrograms(): Promise<Program360Record[]> {
  await seedDatabase();
  const records = await db.select().from(programs).orderBy(desc(programs.createdAt));
  
  return records.map((r) => ({
    ...r,
    clientCategory: (r.clientCategory || "CORPORATE") as any,
    forecastValue: r.forecastValue || "0.00",
    probability: r.probability || "0.00",
    weightedValue: r.weightedValue || "0.00",
    poAmount: r.poAmount || "0.00",
    invoiceAmount: r.invoiceAmount || "0.00",
    sstAmount: r.sstAmount || "0.00",
    amountCollected: r.amountCollected || "0.00",
    outstandingBalance: r.outstandingBalance || "0.00",
    daysOutstanding: r.daysOutstanding ?? 0,
    totalParticipants: r.totalParticipants ?? 0,
    bumiputeraCount: r.bumiputeraCount ?? 0,
    nonBumiputeraCount: r.nonBumiputeraCount ?? 0,
    paymentStatus: r.paymentStatus || "UNPAID",
    r2Status: r.r2Status || "UPCOMING",
    hasActionRequired: !!r.hasActionRequired,
  }));
}

// Fetch a single program by ID with its activity logs
export async function getProgramById(programId: string) {
  await seedDatabase();
  const recs = await db.select().from(programs).where(eq(programs.programId, programId)).limit(1);
  if (recs.length === 0) return null;

  const r = recs[0];
  const logs = await db.select().from(activityLogs).where(eq(activityLogs.programId, programId)).orderBy(desc(activityLogs.activityDate));

  const castedProgram: Program360Record = {
    ...r,
    clientCategory: (r.clientCategory || "CORPORATE") as any,
    forecastValue: r.forecastValue || "0.00",
    probability: r.probability || "0.00",
    weightedValue: r.weightedValue || "0.00",
    poAmount: r.poAmount || "0.00",
    invoiceAmount: r.invoiceAmount || "0.00",
    sstAmount: r.sstAmount || "0.00",
    amountCollected: r.amountCollected || "0.00",
    outstandingBalance: r.outstandingBalance || "0.00",
    daysOutstanding: r.daysOutstanding ?? 0,
    totalParticipants: r.totalParticipants ?? 0,
    bumiputeraCount: r.bumiputeraCount ?? 0,
    nonBumiputeraCount: r.nonBumiputeraCount ?? 0,
    paymentStatus: r.paymentStatus || "UNPAID",
    r2Status: r.r2Status || "UPCOMING",
    hasActionRequired: !!r.hasActionRequired,
  };

  return {
    program: castedProgram,
    logs,
  };
}

// Save or Update program
export async function updateProgram(p: Partial<Program360Record> & { programId: string; user?: string }) {
  await seedDatabase();
  const user = p.user || "System Admin";
  
  // Calculate automated fields
  const forecastVal = parseFloat(p.forecastValue || "0");
  const prob = parseFloat(p.probability || "1");
  const weighted = (forecastVal * prob).toFixed(2);
  const invoiceVal = parseFloat(p.invoiceAmount || "0");
  const collected = parseFloat(p.amountCollected || "0");
  const outstanding = (invoiceVal - collected).toFixed(2);
  const sst = (invoiceVal * 0.08).toFixed(2);

  // Auto determine payment status
  let payStatus = "UNPAID";
  if (collected >= invoiceVal && invoiceVal > 0) {
    payStatus = "PAID";
  } else if (collected > 0 && collected < invoiceVal) {
    payStatus = "PARTIAL";
  } else if (p.daysOutstanding && p.daysOutstanding > 30) {
    payStatus = "OVERDUE";
  }

  // Auto determine R2 Status based on training dates & participants
  let r2Stat = "UPCOMING";
  if (p.trainingEndDate) {
    const today = new Date();
    const end = new Date(p.trainingEndDate);
    if (today > end) {
      const bCount = p.bumiputeraCount ?? 0;
      const nbCount = p.nonBumiputeraCount ?? 0;
      const total = p.totalParticipants ?? (bCount + nbCount);
      if (total > 0 && bCount === 0 && nbCount === 0) {
        r2Stat = "PENDING_DATA";
      } else {
        r2Stat = "COMPLETED";
      }
    }
  }

  // Auto audit action required items
  const reasons: string[] = [];
  let actionRequired = false;

  if (p.daysOutstanding && p.daysOutstanding > 30 && collected < invoiceVal) {
    reasons.push(`Invoice Overdue > 30 Days (${p.daysOutstanding} Days Outstanding)`);
    actionRequired = true;
  }
  if (p.currentStage === "INVOICED" && (!p.poNo || p.poNo.trim() === "")) {
    reasons.push("Missing PO Document: Invoiced without official PO");
    actionRequired = true;
  }
  if (p.currentStage === "PROPOSAL_SUBMITTED" && p.leadDate) {
    const lead = new Date(p.leadDate);
    const diffDays = Math.ceil((new Date().getTime() - lead.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 14) {
      reasons.push("Quotation Pending Approval > 14 Days");
      actionRequired = true;
    }
  }
  if (r2Stat === "PENDING_DATA") {
    reasons.push("Incomplete R2 Records: Completed session with missing participant demographics");
    actionRequired = true;
  }

  const updatedValues = {
    programTitle: p.programTitle,
    clientName: p.clientName,
    clientCategory: p.clientCategory || "CORPORATE",
    picName: p.picName,
    currentStage: p.currentStage,
    leadDate: p.leadDate,
    forecastValue: forecastVal.toFixed(2),
    probability: prob.toFixed(2),
    weightedValue: weighted,
    quotationNo: p.quotationNo,
    quotationDate: p.quotationDate,
    poNo: p.poNo,
    poAmount: p.poAmount || "0.00",
    invoiceNo: p.invoiceNo,
    invoiceDate: p.invoiceDate,
    invoiceAmount: invoiceVal.toFixed(2),
    sstAmount: sst,
    amountCollected: collected.toFixed(2),
    outstandingBalance: outstanding,
    daysOutstanding: p.daysOutstanding || 0,
    paymentStatus: payStatus,
    trainingStartDate: p.trainingStartDate,
    trainingEndDate: p.trainingEndDate,
    totalParticipants: p.totalParticipants || 0,
    bumiputeraCount: p.bumiputeraCount || 0,
    nonBumiputeraCount: p.nonBumiputeraCount || 0,
    r2Status: r2Stat,
    hasActionRequired: actionRequired,
    actionRequiredReason: reasons.length > 0 ? reasons.join(", ") : null,
    updatedAt: new Date(),
  };

  await db.update(programs).set(updatedValues).where(eq(programs.programId, p.programId));

  // Log action
  await db.insert(activityLogs).values({
    programId: p.programId,
    userName: user,
    activityType: "MANUAL_UPDATE",
    description: `Manual update committed: Stage -> ${p.currentStage || "Unchanged"}, Revenue -> RM ${invoiceVal}, Collected -> RM ${collected}.`,
  });

  revalidatePath("/");
  return { success: true };
}

// Log a custom activity/follow-up action
export async function addActivityLog(programId: string, userName: string, activityType: string, description: string) {
  await db.insert(activityLogs).values({
    programId,
    userName,
    activityType,
    description,
  });
  revalidatePath("/");
  return { success: true };
}

// Create a new program record manually
export async function addProgram(p: any) {
  await seedDatabase();
  const id = p.programId || `PRG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const forecastVal = parseFloat(p.forecastValue || "0");
  const prob = parseFloat(p.probability || "1");
  const weighted = (forecastVal * prob).toFixed(2);
  const invoiceVal = parseFloat(p.invoiceAmount || "0");
  const collected = parseFloat(p.amountCollected || "0");
  const outstanding = (invoiceVal - collected).toFixed(2);
  const sst = (invoiceVal * 0.08).toFixed(2);

  let payStatus = "UNPAID";
  if (collected >= invoiceVal && invoiceVal > 0) {
    payStatus = "PAID";
  } else if (collected > 0 && collected < invoiceVal) {
    payStatus = "PARTIAL";
  } else if (p.daysOutstanding && p.daysOutstanding > 30) {
    payStatus = "OVERDUE";
  }

  // Save alias to Master Client Dictionary if not exist
  if (p.clientName) {
    const cleanClient = p.clientName.trim();
    const existingAlias = await db.select().from(clientAliases).where(eq(clientAliases.aliasName, cleanClient)).limit(1);
    if (existingAlias.length === 0) {
      await db.insert(clientAliases).values({
        aliasName: cleanClient,
        masterClientName: cleanClient,
      }).onConflictDoNothing();
    }
  }

  await db.insert(programs).values({
    programId: id,
    programTitle: p.programTitle || "New Program",
    clientName: p.clientName || "General Client",
    clientCategory: p.clientCategory || "CORPORATE",
    picName: p.picName || "Fuzy",
    currentStage: p.currentStage || "LEAD_REGISTERED",
    leadDate: p.leadDate || new Date().toISOString().split("T")[0],
    forecastValue: forecastVal.toFixed(2),
    probability: prob.toFixed(2),
    weightedValue: weighted,
    quotationNo: p.quotationNo || null,
    quotationDate: p.quotationDate || null,
    poNo: p.poNo || null,
    poAmount: p.poAmount || "0.00",
    invoiceNo: p.invoiceNo || null,
    invoiceDate: p.invoiceDate || null,
    invoiceAmount: invoiceVal.toFixed(2),
    sstAmount: sst,
    amountCollected: collected.toFixed(2),
    outstandingBalance: outstanding,
    daysOutstanding: p.daysOutstanding || 0,
    paymentStatus: payStatus,
    trainingStartDate: p.trainingStartDate || null,
    trainingEndDate: p.trainingEndDate || null,
    totalParticipants: p.totalParticipants || 0,
    bumiputeraCount: p.bumiputeraCount || 0,
    nonBumiputeraCount: p.nonBumiputeraCount || 0,
    r2Status: p.r2Status || "UPCOMING",
    hasActionRequired: !!p.hasActionRequired,
    actionRequiredReason: p.actionRequiredReason || null,
  });

  await db.insert(activityLogs).values({
    programId: id,
    userName: p.picName || "System Admin",
    activityType: "EXCEL_IMPORT",
    description: `New program created manually or via Excel: ${p.programTitle}.`,
  });

  revalidatePath("/");
  return { success: true, id };
}

// Delete a program
export async function deleteProgram(programId: string) {
  await db.delete(programs).where(eq(programs.programId, programId));
  revalidatePath("/");
  return { success: true };
}

// Fetch all Client Account Aliases
export async function getClientAliases() {
  await seedDatabase();
  return db.select().from(clientAliases).orderBy(clientAliases.aliasName);
}

// Add client alias
export async function addClientAlias(aliasName: string, masterClientName: string) {
  await db.insert(clientAliases).values({
    aliasName: aliasName.trim(),
    masterClientName: masterClientName.trim(),
  }).onConflictDoNothing();
  revalidatePath("/");
  return { success: true };
}

// Batch excel upload parser and reconciliation engine
export async function bulkUploadPrograms(rawRows: any[]) {
  await seedDatabase();
  let created = 0;
  let updated = 0;

  // Load existing aliases to perform company name reconciliation
  const aliases = await db.select().from(clientAliases);
  const aliasMap = new Map<string, string>();
  aliases.forEach((a) => {
    aliasMap.set(a.aliasName.toLowerCase().trim(), a.masterClientName);
  });

  for (const r of rawRows) {
    if (!r.programTitle || !r.clientName) continue;

    // Reconciliation engine: Map company name to Master Client if alias matches
    const rawClient = r.clientName.trim();
    const resolvedClient = aliasMap.get(rawClient.toLowerCase()) || rawClient;

    // Idempotent Key logic: check if programId exists, if not generate or match by Title + Client
    let matchedId = r.programId;
    if (!matchedId) {
      // Find matching program by title and resolved client to avoid duplicates
      const matches = await db
        .select()
        .from(programs)
        .where(
          and(
            eq(programs.programTitle, r.programTitle),
            eq(programs.clientName, resolvedClient)
          )
        )
        .limit(1);
      
      if (matches.length > 0) {
        matchedId = matches[0].programId;
      } else {
        matchedId = `PRG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    const forecastVal = parseFloat(r.forecastValue || "0");
    const prob = parseFloat(r.probability || "1");
    const weighted = (forecastVal * prob).toFixed(2);
    const invoiceVal = parseFloat(r.invoiceAmount || "0");
    const collected = parseFloat(r.amountCollected || "0");
    const outstanding = (invoiceVal - collected).toFixed(2);
    const sst = (invoiceVal * 0.08).toFixed(2);

    let payStatus = "UNPAID";
    if (collected >= invoiceVal && invoiceVal > 0) {
      payStatus = "PAID";
    } else if (collected > 0 && collected < invoiceVal) {
      payStatus = "PARTIAL";
    } else if (r.daysOutstanding && parseInt(r.daysOutstanding) > 30) {
      payStatus = "OVERDUE";
    }

    let r2Stat = r.r2Status || "UPCOMING";
    if (r.trainingEndDate) {
      const today = new Date();
      const end = new Date(r.trainingEndDate);
      if (today > end) {
        const bCount = parseInt(r.bumiputeraCount || "0");
        const nbCount = parseInt(r.nonBumiputeraCount || "0");
        if ((bCount + nbCount) > 0 && bCount === 0 && nbCount === 0) {
          r2Stat = "PENDING_DATA";
        } else {
          r2Stat = "COMPLETED";
        }
      }
    }

    // Check action rules
    const reasons: string[] = [];
    let actionRequired = false;

    if (parseInt(r.daysOutstanding || "0") > 30 && collected < invoiceVal) {
      reasons.push(`Invoice Overdue > 30 Days (${r.daysOutstanding} Days Outstanding)`);
      actionRequired = true;
    }
    if (r.currentStage === "INVOICED" && (!r.poNo || r.poNo.trim() === "")) {
      reasons.push("Missing PO Document: Invoiced without official PO");
      actionRequired = true;
    }
    if (r2Stat === "PENDING_DATA") {
      reasons.push("Incomplete R2 Records: Completed session with missing participant demographics");
      actionRequired = true;
    }

    const valPayload = {
      programId: matchedId,
      programTitle: r.programTitle,
      clientName: resolvedClient,
      clientCategory: r.clientCategory || "CORPORATE",
      picName: r.picName || "Fuzy",
      currentStage: r.currentStage || "LEAD_REGISTERED",
      leadDate: r.leadDate || new Date().toISOString().split("T")[0],
      forecastValue: forecastVal.toFixed(2),
      probability: prob.toFixed(2),
      weightedValue: weighted,
      quotationNo: r.quotationNo || null,
      quotationDate: r.quotationDate || null,
      poNo: r.poNo || null,
      poAmount: r.poAmount || "0.00",
      invoiceNo: r.invoiceNo || null,
      invoiceDate: r.invoiceDate || null,
      invoiceAmount: invoiceVal.toFixed(2),
      sstAmount: sst,
      amountCollected: collected.toFixed(2),
      outstandingBalance: outstanding,
      daysOutstanding: parseInt(r.daysOutstanding || "0"),
      paymentStatus: payStatus,
      trainingStartDate: r.trainingStartDate || null,
      trainingEndDate: r.trainingEndDate || null,
      totalParticipants: parseInt(r.totalParticipants || "0"),
      bumiputeraCount: parseInt(r.bumiputeraCount || "0"),
      nonBumiputeraCount: parseInt(r.nonBumiputeraCount || "0"),
      r2Status: r2Stat,
      hasActionRequired: actionRequired,
      actionRequiredReason: reasons.length > 0 ? reasons.join(", ") : null,
    };

    const existing = await db.select().from(programs).where(eq(programs.programId, matchedId)).limit(1);
    if (existing.length > 0) {
      await db.update(programs).set(valPayload).where(eq(programs.programId, matchedId));
      updated++;
    } else {
      await db.insert(programs).values(valPayload);
      created++;
    }

    // Log the excel activity
    await db.insert(activityLogs).values({
      programId: matchedId,
      userName: "Excel Loader",
      activityType: "EXCEL_IMPORT",
      description: `Excel record parsed. Title: '${r.programTitle}'. Resolved client: '${resolvedClient}'. Status: ${existing.length > 0 ? 'UPDATED' : 'CREATED'}.`,
    });
  }

  revalidatePath("/");
  return { success: true, created, updated };
}
