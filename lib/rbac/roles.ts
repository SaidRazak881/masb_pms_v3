export const ROLES = ["super_admin","admin","manager","pic","viewer"] as const;
export type UserRole = typeof ROLES[number];
export const ROLE_LABELS: Record<UserRole,string> = { super_admin:"Super Admin", admin:"Admin", manager:"Manager", pic:"PIC", viewer:"Viewer" };
export const ROLE_PERMISSIONS = {
  super_admin:["*"], admin:["dashboard","action-center","programs","quotations","purchase-orders","financials","training","reports","data-quality","settings"],
  manager:["dashboard","action-center","programs","quotations","purchase-orders","financials","training","reports","data-quality"],
  pic:["dashboard","action-center","programs","quotations","purchase-orders","training"], viewer:["dashboard","action-center","programs","reports"]
} as const;
export function canAccess(role: UserRole, area: string) { return ROLE_PERMISSIONS[role].includes("*") || ROLE_PERMISSIONS[role].includes(area as never); }
