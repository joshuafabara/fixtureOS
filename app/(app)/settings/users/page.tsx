import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { UsersManager } from "./users-manager";

export default async function UsersPage() {
  const orgId = await requireOrg();

  const userList = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  })
  .from(users)
  .where(eq(users.organizationId, orgId))
  .orderBy(asc(users.name));

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Gestión de usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">{userList.length} usuario{userList.length !== 1 ? "s" : ""} en tu organización.</p>
      </div>
      <UsersManager initialUsers={userList} />
    </div>
  );
}
