import type { LayoutProps } from "@/lib/type";

const DashboardLayout = ({ children }: LayoutProps) => {
  return <div className="w-full">{children}</div>;
};

export default DashboardLayout;
