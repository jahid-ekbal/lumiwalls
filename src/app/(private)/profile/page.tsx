import PageHeader from "@/components/UI/PageHeader";
import { buttonVariants } from "@/components/shadcnui/button";
import { requireActiveUser } from "@/lib/auth/session";
import { createMetadata } from "@/lib/metadata";
import { profileParamsSchema } from "@/lib/zodSchema";
import { ShieldIcon, UserRoundIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import ProfileIdentity from "./_components/profile-identity";
import ProfileSecurity from "./_components/profile-security";
import ProfileWallpapers from "./_components/profile-wallpapers";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Profile",
  description: "Your identity, wallpapers, boards, and account security on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type ProfilePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const PROFILE_TABS = [
  { value: "identity", label: "Identity", icon: UserRoundIcon },
  { value: "security", label: "Security", icon: ShieldIcon },
] as const;

const ProfilePage = async ({ searchParams }: ProfilePageProps) => {
  const session = await requireActiveUser();
  const raw = await searchParams;
  const parsed = profileParamsSchema.safeParse({ tab: firstParam(raw.tab) });
  const { tab } = parsed.success ? parsed.data : profileParamsSchema.parse({});
  const forceReset =
    firstParam(raw.forceReset) === "1" || session.user.mustChangePassword;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Creator"
        title="Profile"
        description="Your member identity, submissions, boards, download history, and account security."
      />

      <div className="border-border/60 bg-card/50 w-fit rounded-control border p-1">
        <div className="flex gap-1">
          {PROFILE_TABS.map(({ value, label, icon: Icon }) => {
            const isActive = tab === value;
            return (
              <Link
                key={value}
                href={
                  (value === "identity" ? "/profile" : (
                    "/profile?tab=security"
                  )) as Route
                }
                aria-current={isActive ? "page" : undefined}
                className={buttonVariants({
                  variant: isActive ? "default" : "ghost",
                  size: "sm",
                })}
                data-active={isActive ? true : undefined}>
                <Icon data-icon="inline-start" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {tab === "identity" && !session.user.mustChangePassword ?
        <div className="grid gap-6">
          <ProfileIdentity />
          <ProfileWallpapers />
        </div>
      : <ProfileSecurity forceReset={forceReset} />}
    </div>
  );
};

export default ProfilePage;
