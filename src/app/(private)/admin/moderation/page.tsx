import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Moderation",
  description: "Moderate content and submissions on Lumiwalls",
});

const ModerationPage = () => {
  return <h1>Moderation</h1>;
};

export default ModerationPage;
