import { Providers } from "@/components/layout/providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return <Providers session={session}>{children}</Providers>;
}
