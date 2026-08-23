import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-bg text-text">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
