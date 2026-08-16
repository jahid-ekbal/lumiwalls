import { auth } from "@/lib/auth";
import type { LayoutProps } from "@/lib/type";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const AdminLayout = async ({ children }: LayoutProps) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user.role !== "admin") {
    redirect("/browse");
  }

  return <>{children}</>;
};

export default AdminLayout;
