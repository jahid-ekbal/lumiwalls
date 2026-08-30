import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Featured",
  description: "Manage featured wallpapers on Lumiwalls",
});

const FeaturedPage = () => {
  return <h1>Featured</h1>;
};

export default FeaturedPage;
