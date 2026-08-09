import { cn } from "@/lib/utils";
import { WallpaperIcon } from "lucide-react";

const Brand = ({
  showText = true,
  className,
}: {
  showText?: boolean;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <WallpaperIcon className="size-6 shrink-0" />
      {showText && <span className="text-xl font-semibold">Lumiwalls</span>}
    </div>
  );
};

export default Brand;
