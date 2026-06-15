import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { redirect } from "next/navigation";

export type AppSession = {
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    role: string;
  };
};

export async function getSession(): Promise<AppSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session as unknown as AppSession;
}

export async function getOptionalSession(): Promise<AppSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session as unknown as AppSession;
}

/** Returns organizationId or throws if not authenticated */
export async function requireOrg(): Promise<string> {
  const session = await getSession();
  return session.user.organizationId;
}
