import SettingsClient from "@/components/Settings/SettingsClient";
import PageHeader from "@/components/UI/PageHeader";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Settings",
  description: "Manage your profile details and appearance on Lumiwalls",
});

const SettingsPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      bio: true,
      location: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your public profile details, gallery appearance, and security."
      />
      <SettingsClient
        initialName={user.name}
        initialBio={user.bio ?? ""}
        initialLocation={user.location ?? ""}
        email={user.email}
      />
    </div>
  );
};

export default SettingsPage;
