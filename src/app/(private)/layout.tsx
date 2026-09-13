import PrivateHeader from "@/components/Header/PrivateHeader";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcnui/sidebar";
import { TooltipProvider } from "@/components/shadcnui/tooltip";
import { auth } from "@/lib/auth";
import { createMetadata } from "@/lib/metadata";
import type { LayoutProps } from "@/lib/type";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Browse",
  description: "Browse and manage wallpapers on Lumiwalls",
});

const Privatelayout = async ({ children }: LayoutProps) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

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
