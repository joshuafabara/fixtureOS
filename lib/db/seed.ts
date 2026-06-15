import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Seeding FixtureOS...");

  // Organization
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: "Liga Deportiva Quito",
      slug: "liga-quito",
    })
    .returning();
  console.log("✓ Organization:", org.name);

  // Admin user
  const passwordHash = await bcrypt.hash("admin1234", 12);
  const [admin] = await db
    .insert(schema.users)
    .values({
      organizationId: org.id,
      email: "admin@fixtureos.dev",
      passwordHash,
      name: "Administrador Demo",
      role: "admin",
    })
    .returning();
  console.log("✓ User:", admin.email);

  // Courts
  const courtNames = ["Cancha A", "Cancha B", "Cancha C"];
  const insertedCourts = await db
    .insert(schema.courts)
    .values(
      courtNames.map((name) => ({
        organizationId: org.id,
        name,
        isActive: true,
      }))
    )
    .returning();
  console.log("✓ Courts:", insertedCourts.map((c) => c.name).join(", "));

  // Court availability — Fri/Sat/Sun 08:00-21:00
  const availabilityRules = [];
  for (const court of insertedCourts) {
    for (const day of [5, 6, 0]) {
      // 5=Fri, 6=Sat, 0=Sun
      availabilityRules.push({
        courtId: court.id,
        dayOfWeek: day,
        startTime: "08:00:00",
        endTime: "21:00:00",
        isAvailable: true,
      });
    }
  }
  await db.insert(schema.courtAvailabilityRules).values(availabilityRules);
  console.log("✓ Court availability rules");

  // Tournament
  const [tournament] = await db
    .insert(schema.tournaments)
    .values({
      organizationId: org.id,
      name: "Copa Alpha 2026",
      sport: "basketball",
      status: "active",
    })
    .returning();
  console.log("✓ Tournament:", tournament.name);

  // Clubs
  const clubData = [
    { name: "Spartans BC", normalizedName: "spartans bc" },
    { name: "CVU Quito", normalizedName: "cvu quito" },
    { name: "Los Andes", normalizedName: "los andes" },
    { name: "Crossover Club", normalizedName: "crossover club" },
    { name: "Bulls Academy", normalizedName: "bulls academy" },
    { name: "Hawks Sport", normalizedName: "hawks sport" },
  ];
  const insertedClubs = await db
    .insert(schema.clubs)
    .values(clubData.map((c) => ({ ...c, organizationId: org.id })))
    .returning();
  console.log("✓ Clubs:", insertedClubs.length);

  // Club contacts
  const contacts = [
    { clubIdx: 0, name: "Juan Pérez", role: "Director", whatsapp: "593998375914", isPrimary: true },
    { clubIdx: 1, name: "María García", role: "Coordinadora", whatsapp: "593987654321", isPrimary: true },
    { clubIdx: 2, name: "Carlos López", role: "Presidente", whatsapp: null, isPrimary: true },
    { clubIdx: 3, name: "Ana Rodríguez", role: "Secretaria", whatsapp: "593912345678", isPrimary: true },
    { clubIdx: 4, name: "Pedro Martínez", role: "Director Técnico", whatsapp: "593998001122", isPrimary: true },
  ];
  await db.insert(schema.clubContacts).values(
    contacts.map((c) => ({
      organizationId: org.id,
      clubId: insertedClubs[c.clubIdx].id,
      contactName: c.name,
      contactRole: c.role,
      whatsappNumber: c.whatsapp,
      isPrimary: c.isPrimary,
    }))
  );
  console.log("✓ Club contacts");

  // Categories
  const categoryData: Array<{
    name: string;
    colorHex: string;
    startDate: string | null;
    gameModeType: string | null;
    gameModeJson: Record<string, unknown> | null;
  }> = [
    { name: "U12 Masculino", colorHex: "#3b82f6", startDate: "2026-07-05", gameModeType: "groups", gameModeJson: { type: "groups", groups: 2, groupRounds: 1, classification: "top_2_per_group", playoffs: ["semifinal", "final"] } },
    { name: "U14 Masculino", colorHex: "#f59e0b", startDate: "2026-07-05", gameModeType: "double_round_robin", gameModeJson: { type: "double_round_robin" } },
    { name: "U17 Masculino", colorHex: "#8b5cf6", startDate: "2026-07-12", gameModeType: "single_round_robin", gameModeJson: { type: "single_round_robin" } },
    { name: "Senior Masculino", colorHex: "#ef4444", startDate: null, gameModeType: null, gameModeJson: null },
    { name: "Senior Femenino", colorHex: "#ec4899", startDate: "2026-07-19", gameModeType: "single_round_robin", gameModeJson: { type: "single_round_robin" } },
  ];
  const insertedCategories = await db
    .insert(schema.categories)
    .values(
      categoryData.map((c) => ({
        organizationId: org.id,
        tournamentId: tournament.id,
        name: c.name,
        colorHex: c.colorHex,
        startDate: c.startDate,
        isActiveForFixture: c.startDate !== null,
      }))
    )
    .returning();
  console.log("✓ Categories:", insertedCategories.length);

  // Game modes for eligible categories
  const gameModeInserts = insertedCategories
    .map((cat, i) => {
      const cd = categoryData[i];
      if (!cd.gameModeType || !cd.gameModeJson) return null;
      return {
        organizationId: org.id,
        tournamentId: tournament.id,
        categoryId: cat.id,
        name: cd.gameModeType,
        source: "manual" as const,
        modeJson: cd.gameModeJson,
      };
    })
    .filter(Boolean) as object[];

  if (gameModeInserts.length > 0) {
    const insertedModes = await db
      .insert(schema.gameModes)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .values(gameModeInserts as any[])
      .returning();

    // Update category.game_mode_id
    const { eq } = await import("drizzle-orm");
    for (const mode of insertedModes) {
      if (!mode.categoryId) continue;
      await db
        .update(schema.categories)
        .set({ gameModeId: mode.id, isActiveForFixture: true })
        .where(eq(schema.categories.id, mode.categoryId));
    }
  }
  console.log("✓ Game modes");

  // Teams per category
  const teamsByCategory = [
    // U12M — 4 teams
    [
      { name: "Spartans U12", clubIdx: 0 },
      { name: "CVU U12", clubIdx: 1 },
      { name: "Los Andes U12", clubIdx: 2 },
      { name: "Crossover U12", clubIdx: 3 },
    ],
    // U14M — 6 teams
    [
      { name: "Spartans U14", clubIdx: 0 },
      { name: "CVU U14", clubIdx: 1 },
      { name: "Los Andes U14", clubIdx: 2 },
      { name: "Crossover U14", clubIdx: 3 },
      { name: "Bulls U14", clubIdx: 4 },
      { name: "Hawks U14", clubIdx: 5 },
    ],
    // U17M — 8 teams
    [
      { name: "Spartans U17", clubIdx: 0 },
      { name: "CVU U17", clubIdx: 1 },
      { name: "Los Andes U17", clubIdx: 2 },
      { name: "Crossover U17", clubIdx: 3 },
      { name: "Bulls U17", clubIdx: 4 },
      { name: "Hawks U17", clubIdx: 5 },
      { name: "Spartans U17 B", clubIdx: 0 },
      { name: "CVU U17 B", clubIdx: 1 },
    ],
    // Senior M — 4 teams (no start date, not fixture-eligible)
    [
      { name: "Spartans Senior", clubIdx: 0 },
      { name: "CVU Senior", clubIdx: 1 },
      { name: "Los Andes Senior", clubIdx: 2 },
      { name: "Bulls Senior", clubIdx: 4 },
    ],
    // Senior F — 4 teams
    [
      { name: "Spartans F", clubIdx: 0 },
      { name: "CVU F", clubIdx: 1 },
      { name: "Los Andes F", clubIdx: 2 },
      { name: "Hawks F", clubIdx: 5 },
    ],
  ];

  for (let ci = 0; ci < insertedCategories.length; ci++) {
    const cat = insertedCategories[ci];
    const teamsData = teamsByCategory[ci];
    await db.insert(schema.teams).values(
      teamsData.map((t) => ({
        organizationId: org.id,
        categoryId: cat.id,
        clubId: insertedClubs[t.clubIdx].id,
        name: t.name,
        normalizedName: t.name.toLowerCase(),
        status: "active" as const,
      }))
    );
  }
  console.log("✓ Teams");

  // Organization context version (sample)
  await db.insert(schema.contextVersions).values({
    organizationId: org.id,
    scope: "organization",
    scopeId: null,
    rawPrompt:
      "Todos los torneos usan Cancha A, B y C. Los juegos se juegan viernes a domingo de 8:00 a 21:00. La duración predeterminada de cada partido es 1 hora. Se intenta agrupar equipos del mismo club.",
    parsedConstraints: {
      courts: ["Cancha A", "Cancha B", "Cancha C"],
      playDays: ["friday", "saturday", "sunday"],
      timeWindow: { start: "08:00", end: "21:00" },
      defaultMatchDurationMinutes: 60,
      clubGrouping: { enabled: true, type: "soft" },
    },
    versionNumber: 1,
    createdBy: admin.id,
  });
  console.log("✓ Organization context");

  console.log("\n✅ Seed complete!");
  console.log("   Login: admin@fixtureos.dev / admin1234");
  console.log("   Org:   Liga Deportiva Quito");

  await client.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
