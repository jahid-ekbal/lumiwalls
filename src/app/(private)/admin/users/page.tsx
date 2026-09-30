import { createMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { ModerationSkeleton } from "../_components/dashboard-skeletons";
import UsersContent from "./_components/users-content";

export const metadata = createMetadata({
  title: "Users",
  description: "Manage users on Lumiwalls",
});

const UsersPage = () => {
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
        <UsersContent />
      </Suspense>
    </div>
  );
};

export default UsersPage;
