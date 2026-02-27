import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { authClient } from "@/lib/auth-client";

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const handleSignOut = async () => {
    "use server";
    await authClient.signOut();
    redirect("/signin");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <DashboardSidebar onSignOut={handleSignOut} />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
