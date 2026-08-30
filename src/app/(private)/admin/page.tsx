import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Admin Dashboard",
  description: "Admin dashboard overview on Lumiwalls",
});

const AdminDashboardPage = () => {
  return <h1>Dashboard</h1>;
};

export default AdminDashboardPage;
