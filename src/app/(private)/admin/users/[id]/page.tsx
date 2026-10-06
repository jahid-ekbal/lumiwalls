import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { ModerationSkeleton } from "../../_components/dashboard-skeletons";
import UserDetailContent from "./_components/user-detail-content";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "User detail",
  description: "Inspect a user account on Lumiwalls",
});

type Props = {
  params: Promise<{ id: string }>;
};

const UserDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <div className="grid gap-6">
      <Suspense fallback={<ModerationSkeleton />}>
        <UserDetailContent userId={id} />
      </Suspense>
    </div>
  );
};

export default UserDetailPage;
