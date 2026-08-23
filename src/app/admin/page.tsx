import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";

/** /admin without session → login; with session → dashboard (sibling route group). */
export default async function AdminIndexRedirect() {
  const session = await getAdminSession();
  if (!session.isLoggedIn) redirect("/admin/login");
  redirect("/admin/dashboard");
}
