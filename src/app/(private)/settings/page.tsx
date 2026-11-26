import SettingsClient from "@/components/Settings/SettingsClient";
import PageHeader from "@/components/UI/PageHeader";
import { requireActiveUser } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { createMetadata } from "@/lib/metadata";
import { isPrimaryAdminEmail } from "@/server/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Settings",
  description: "Manage your profile details and appearance on Lumiwalls",
});

const SettingsPage = async () => {
  const session = await requireActiveUser();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      bio: true,
      location: true,
      handle: true,
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
        description="Manage your public profile details, creator handle, gallery appearance, and account security."
      />
      <SettingsClient
        initialName={user.name}
        initialBio={user.bio ?? ""}
        initialLocation={user.location ?? ""}
        initialHandle={user.handle ?? ""}
        email={user.email}
        isProtectedAdmin={isPrimaryAdminEmail(user.email)}
      />
    </div>
  );
};

export default SettingsPage;
