import AmbientBackground from "@/components/Ambient/AmbientBackground";
import PrivateHeader from "@/components/Header/PrivateHeader";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcnui/sidebar";
import { TooltipProvider } from "@/components/shadcnui/tooltip";
import { auth } from "@/lib/auth";
import { ensureHandle } from "@/lib/handle";
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

  // Lazily generate the public handle on first visit; it early-returns
  // in about one query once set.
  await ensureHandle(session.user.id);

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <a
          href="#main-content"
          className="bg-primary text-primary-foreground focus-visible:ring-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none">
          Skip to main content
        </a>
        <AppSidebar />
        <SidebarInset className="isolate">
          <AmbientBackground />
          <PrivateHeader />
          <main
            id="main-content"
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default Privatelayout;
