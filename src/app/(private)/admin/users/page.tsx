import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Users",
  description: "Manage users on Lumiwalls",
});

const UsersPage = () => {
  return <h1>Users</h1>;
};

export default UsersPage;
