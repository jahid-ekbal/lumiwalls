import type { LayoutProps } from "@/lib/type";

const DashboardLayout = ({ children }: LayoutProps) => {
  return <div className="w-full p-6">{children}</div>;
};

export default DashboardLayout;
