import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

import { seedDatabase } from "@/db/seeder";

export async function GET() {
  try {
    // Ensure the database has seeded data
    await seedDatabase();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, seeded: true });
  } catch (error: any) {
    console.error("Healthcheck/seed error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
