import PageHeader from "@/components/UI/PageHeader";
import { TableCardSkeleton } from "@/components/UI/Skeletons";
import { createMetadata } from "@/lib/metadata";
import { usersSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import UsersContent from "./_components/users-content";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Users",
  description: "Manage users on Lumiwalls",
});

const firstParam = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

type UsersPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const UsersPage = async ({ searchParams }: UsersPageProps) => {
  const raw = await searchParams;
  const parsed = usersSearchParamsSchema.safeParse({
    q: firstParam(raw.q),
    role: firstParam(raw.role),
    status: firstParam(raw.status),
    sort: firstParam(raw.sort),
    page: firstParam(raw.page),
  });
  const params =
    parsed.success ? parsed.data : usersSearchParamsSchema.parse({});

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Accounts"
        title="Users"
        description="Search accounts, review upload counts, and manage roles or bans."
      />
      <Suspense fallback={<TableCardSkeleton rows={6} />}>
        <UsersContent params={params} />
      </Suspense>
    </div>
  );
};

export default UsersPage;
