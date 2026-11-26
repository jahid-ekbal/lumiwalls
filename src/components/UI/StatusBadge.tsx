import { Badge } from "@/components/shadcnui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  ClockIcon,
  EyeOffIcon,
  GlobeIcon,
  ShieldAlertIcon,
  XCircleIcon,
} from "lucide-react";

export type AppStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "RESOLVED"
  | "DISMISSED"
  | "ACTIVE"
  | "INACTIVE"
  | "BANNED"
  | "PUBLIC"
  | "PRIVATE";

export function deriveWallpaperStatus({
  isApproved,
  moderationStatus,
}: {
  isApproved: boolean;
  moderationStatus?: string | null;
}): "APPROVED" | "PENDING" | "REJECTED" {
  if (isApproved) {
    return "APPROVED";
  }
  if (moderationStatus === "REJECTED") {
    return "REJECTED";
  }
  return "PENDING";
}

const STATUS_META: Record<
  AppStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon?: typeof CheckCircle2Icon;
  }
> = {
  APPROVED: {
    label: "Approved",
    variant: "default",
    icon: CheckCircle2Icon,
  },
  PENDING: {
    label: "Pending review",
    variant: "secondary",
    icon: ClockIcon,
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircleIcon,
  },
  RESOLVED: {
    label: "Resolved",
    variant: "default",
    icon: CheckCircle2Icon,
  },
  DISMISSED: {
    label: "Dismissed",
    variant: "outline",
    icon: XCircleIcon,
  },
  ACTIVE: {
    label: "Active",
    variant: "default",
  },
  INACTIVE: {
    label: "Inactive",
    variant: "outline",
  },
  BANNED: {
    label: "Banned",
    variant: "destructive",
    icon: ShieldAlertIcon,
  },
  PUBLIC: {
    label: "Public",
    variant: "secondary",
    icon: GlobeIcon,
  },
  PRIVATE: {
    label: "Hidden",
    variant: "outline",
    icon: EyeOffIcon,
  },
};

type StatusBadgeProps = {
  status: AppStatus;
  label?: string;
  showIcon?: boolean;
  className?: string;
};

const StatusBadge = ({
  status,
  label,
  showIcon = true,
  className,
}: StatusBadgeProps) => {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <Badge
      variant={meta.variant}
      className={cn(className)}>
      {showIcon && Icon ?
        <Icon
          aria-hidden="true"
          data-icon="inline-start"
        />
      : null}
      {label ?? meta.label}
    </Badge>
  );
};

export default StatusBadge;
