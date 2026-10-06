import { createMetadata } from "@/lib/metadata";
import { usersSearchParamsSchema } from "@/lib/zodSchema";
import { Suspense } from "react";
import { ModerationSkeleton } from "../_components/dashboard-skeletons";
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
      <div className="grid gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Users
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage users on Lumiwalls
        </p>
      </div>
      <Suspense fallback={<ModerationSkeleton />}>
        <UsersContent params={params} />
      </Suspense>
    </div>
  );
};

export default UsersPage;
