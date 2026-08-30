import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Settings",
  description: "Manage your account settings on Lumiwalls",
});

const SettingsPage = () => {
  return <h1>Settings</h1>;
};

export default SettingsPage;
