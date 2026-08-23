import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session.isLoggedIn) redirect("/admin/dashboard");

  return <AdminLoginForm />;
}
