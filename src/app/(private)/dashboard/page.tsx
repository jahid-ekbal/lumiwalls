import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Dashboard",
  description: "Your personal dashboard overview on Lumiwalls",
});

const DashboardPage = () => {
  return <h1>Dashboard</h1>;
};

export default DashboardPage;
