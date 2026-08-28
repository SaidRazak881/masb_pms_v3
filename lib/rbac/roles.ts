export const ROLES = ["super_admin", "admin", "manager", "pic", "viewer"] as const;
export type UserRole = typeof ROLES[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  pic: "PIC",
  viewer: "Viewer",
};

export const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  admin: ["dashboard", "action-center", "programs", "quotations", "purchase-orders", "financials", "training", "reports", "data-quality", "settings"],
  manager: ["dashboard", "action-center", "programs", "quotations", "purchase-orders", "financials", "training", "reports", "data-quality"],
  pic: ["dashboard", "action-center", "programs", "quotations", "purchase-orders", "training"],
  viewer: ["dashboard", "action-center", "programs", "reports"],
} as const satisfies Record<UserRole, readonly string[]>;

type Permission = (typeof ROLE_PERMISSIONS)[UserRole][number];

export function canAccess(role: UserRole, area: string): boolean {
  const permissions: readonly string[] = ROLE_PERMISSIONS[role];
  return permissions.includes("*") || permissions.includes(area);
}

export type { Permission };
