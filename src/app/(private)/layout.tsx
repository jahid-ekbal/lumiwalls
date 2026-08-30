import PrivateHeader from "@/components/Header/PrivateHeader";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcnui/sidebar";
import { TooltipProvider } from "@/components/shadcnui/tooltip";
import { createMetadata } from "@/lib/metadata";
import type { LayoutProps } from "@/lib/type";
import { cookies } from "next/headers";

export const metadata = createMetadata({
  title: "Browse",
  description: "Browse and manage wallpapers on Lumiwalls",
});

const Privatelayout = async ({ children }: LayoutProps) => {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
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
