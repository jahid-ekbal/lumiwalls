"use client";

import { Button } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { Field, FieldLabel } from "@/components/shadcnui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { Textarea } from "@/components/shadcnui/textarea";
import { createReport } from "@/server/actions/moderation";
import { FlagIcon, Loader2Icon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "NUDITY", label: "Nudity" },
  { value: "COPYRIGHT", label: "Copyright" },
  { value: "VIOLENCE", label: "Violence" },
  { value: "OTHER", label: "Other" },
];

type ReportDialogProps = {
  wallpaperId: string;
  wallpaperTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
};

export function ReportDialog({
  wallpaperId,
  wallpaperTitle,
  open,
  onOpenChange,
  onSubmitted,
}: ReportDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState("SPAM");
  const [details, setDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  const handleSubmit = async () => {
    if (reporting) {
      return;
    }
    if (reason === "OTHER" && !details.trim()) {
      toast.error("Details are required for Other");
      return;
    }
    setReporting(true);
    try {
      const result = await createReport({
        wallpaperId,
        reason,
        details,
      });
      if (!result.success) {
        toast.error(
          result.error === "ALREADY_REPORTED" ?
            "Already reported, awaiting review"
          : result.error === "CANNOT_REPORT_OWN" ?
            "Cannot flag your own wallpaper"
          : result.error === "DETAILS_REQUIRED" ?
            "Details are required for Other"
          : "Report failed, please try again",
        );
        return;
      }
      toast.success("Thanks, report submitted");
      setDetails("");
      onOpenChange(false);
      onSubmitted?.();
      router.refresh();
    } catch {
      toast.error("Report failed, please try again");
    } finally {
      setReporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flag wallpaper</DialogTitle>
          <DialogDescription>
            {`Report ${wallpaperTitle} for review`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field>
            <FieldLabel htmlFor="report-reason">Reason</FieldLabel>
            <Select
              value={reason}
              items={REPORT_REASONS}
              onValueChange={(value) => setReason(value ?? "SPAM")}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="report-details">Details</FieldLabel>
            <Textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={
                reason === "OTHER" ? "Required for Other" : "Optional details"
              }
            />
          </Field>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={reporting}>
            {reporting ?
              <Loader2Icon
                data-icon="inline-start"
                className="size-4 animate-spin"
              />
            : <SendIcon
                data-icon="inline-start"
                className="size-4"
              />
            }
            Submit report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ReportWallpaperButtonProps = {
  wallpaperId: string;
  wallpaperTitle: string;
  reported: boolean;
  size?: "xs" | "sm" | "default";
};

const ReportWallpaperButton = ({
  wallpaperId,
  wallpaperTitle,
  reported,
  size = "sm",
}: ReportWallpaperButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportedLocal, setReportedLocal] = useState(reported);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size}
        disabled={reportedLocal}
        onClick={(event) => {
          event.stopPropagation();
          setDialogOpen(true);
        }}>
        <FlagIcon
          data-icon="inline-start"
          className="size-4"
        />
        {reportedLocal ? "Reported" : "Report"}
      </Button>
      <ReportDialog
        wallpaperId={wallpaperId}
        wallpaperTitle={wallpaperTitle}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmitted={() => setReportedLocal(true)}
      />
    </>
  );
};

export default ReportWallpaperButton;
