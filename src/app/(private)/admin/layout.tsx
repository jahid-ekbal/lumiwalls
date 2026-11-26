import { requireAdminUser } from "@/lib/auth/session";
import type { LayoutProps } from "@/lib/type";

const AdminLayout = async ({ children }: LayoutProps) => {
  await requireAdminUser();
  return <div className="w-full">{children}</div>;
};

export default AdminLayout;
