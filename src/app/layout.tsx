import ThemeProvider from "@/components/Providers/ThemeProvider";
import { notoSansHeading, nunitoSans } from "@/lib/fonts";
import type { LayoutProps } from "@/lib/type";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lumiwalls",
    template: "%s | Lumiwalls",
  },
  description: "Discover and share beautiful wallpapers on Lumiwalls",
};

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        "font-sans",
        nunitoSans.variable,
        notoSansHeading.variable,
      )}
      suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute={"class"}
          defaultTheme="dark"
          enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
