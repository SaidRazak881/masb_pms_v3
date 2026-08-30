import { getPrograms, getClientAliases } from "@/app/actions";
import MimosPortal from "@/components/MimosPortal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch initial corporate training programs and client aliases from the database
  const initialPrograms = await getPrograms();
  const initialAliases = await getClientAliases();

  return (
    <MimosPortal
      initialPrograms={initialPrograms}
      initialAliases={initialAliases}
    />
  );
}
