import { createMetadata } from "@/lib/metadata";
import type { LayoutProps } from "@/lib/type";

export const metadata = createMetadata({
  title: "Welcome",
  description: "Access your Lumiwalls account",
});

const Publiclayout = ({ children }: LayoutProps) => {
  return <>{children}</>;
};

export default Publiclayout;
