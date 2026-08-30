import { pgTable, serial, text, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const programs = pgTable("programs", {
  programId: text("program_id").primaryKey(), // e.g. 'PRG-2026-0042'
  programTitle: text("program_title").notNull(),
  clientName: text("client_name").notNull(),
  clientCategory: text("client_category").notNull(), // 'GOVERNMENT' | 'CORPORATE' | 'INTERNAL' | 'FOC'
  picName: text("pic_name").notNull(), // e.g. 'Fuzy', 'Adila', 'Suhairi', 'Fuzi'
  currentStage: text("current_stage").notNull(), // 'LEAD_REGISTERED' | 'PROPOSAL_SUBMITTED' | 'QUOTATION_APPROVED' | 'PO_RECEIVED' | 'INVOICED' | 'PAID' | 'TRAINING_COMPLETED'
  
  // R3 Funnel Data
  leadDate: text("lead_date"),
  forecastValue: numeric("forecast_value").default("0"),
  probability: numeric("probability").default("0"), // e.g. 0.85
  weightedValue: numeric("weighted_value").default("0"),
  
  // Quotation & PO Data
  quotationNo: text("quotation_no"),
  quotationDate: text("quotation_date"),
  poNo: text("po_no"),
  poAmount: numeric("po_amount").default("0"),
  
  // R1 Financial Data
  invoiceNo: text("invoice_no"),
  invoiceDate: text("invoice_date"),
  invoiceAmount: numeric("invoice_amount").default("0"),
  sstAmount: numeric("sst_amount").default("0"),
  amountCollected: numeric("amount_collected").default("0"),
  outstandingBalance: numeric("outstanding_balance").default("0"),
  daysOutstanding: integer("days_outstanding").default(0),
  paymentStatus: text("payment_status").default("UNPAID"), // 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERDUE'
  
  // R2 Training Data
  trainingStartDate: text("training_start_date"),
  trainingEndDate: text("training_end_date"),
  totalParticipants: integer("total_participants").default(0),
  bumiputeraCount: integer("bumiputera_count").default(0),
  nonBumiputeraCount: integer("non_bumiputera_count").default(0),
  r2Status: text("r2_status").default("UPCOMING"), // 'COMPLETED' | 'PENDING_DATA' | 'UPCOMING'
  
  // Action Required Flags
  hasActionRequired: boolean("has_action_required").default(false),
  actionRequiredReason: text("action_required_reason"), // store as stringified JSON array or comma separated
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  programId: text("program_id").references(() => programs.programId, { onDelete: "cascade" }),
  activityDate: timestamp("activity_date").defaultNow(),
  userName: text("user_name").notNull(),
  activityType: text("activity_type").notNull(), // 'EMAIL_SENT', 'PAYMENT_RECEIVED', 'PO_UPLOADED', 'MANUAL_UPDATE', 'EXCEL_IMPORT'
  description: text("description").notNull(),
});

export const clientAliases = pgTable("client_aliases", {
  id: serial("id").primaryKey(),
  aliasName: text("alias_name").notNull().unique(), // e.g. "MIMOS Berhad"
  masterClientName: text("master_client_name").notNull(), // e.g. "MIMOS"
});
