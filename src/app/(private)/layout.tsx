import PrivateHeader from "@/components/Header/PrivateHeader";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcnui/sidebar";
import { TooltipProvider } from "@/components/shadcnui/tooltip";
import type { LayoutProps } from "@/lib/type";

const Privatelayout = ({ children }: LayoutProps) => {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <PrivateHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default Privatelayout;
