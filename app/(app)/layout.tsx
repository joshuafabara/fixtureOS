import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Providers } from "@/components/layout/providers";
import { db } from "@/lib/db";
import { organizations, tournaments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as typeof session.user & {
    organizationId: string;
    name: string;
  };

  const orgId = user.organizationId;
  const activeTournamentId = cookies().get("activeTournamentId")?.value ?? null;

  const [[org], allTournaments] = await Promise.all([
    db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, orgId)).limit(1),
    db.select({ id: tournaments.id, name: tournaments.name, status: tournaments.status })
      .from(tournaments)
      .where(eq(tournaments.organizationId, orgId))
      .orderBy(desc(tournaments.createdAt)),
  ]);

  const activeTournament =
    allTournaments.find((t) => t.id === activeTournamentId) ??
    allTournaments.find((t) => t.status === "active") ??
    allTournaments[0] ??
    null;

  return (
    <Providers session={session}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar
            orgName={org?.name ?? "FixtureOS"}
            userName={user.name ?? (user.email as string)}
            tournaments={allTournaments}
            activeTournamentId={activeTournament?.id ?? null}
            activeTournamentName={activeTournament?.name ?? null}
          />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
