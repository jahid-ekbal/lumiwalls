import { Card, CardContent } from "@/components/shadcnui/card";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  ArrowRightIcon,
  BarChart3Icon,
  FlagIcon,
  FolderOpenIcon,
  LayoutGridIcon,
  ShieldIcon,
  SparklesIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

const modules = [
  {
    title: "Moderation",
    description: "Review pending uploads and user reports",
    icon: ShieldIcon,
    href: "/admin/moderation" as Route,
  },
  {
    title: "Reports",
    description: "Handle flags filed against wallpapers",
    icon: FlagIcon,
    href: "/admin/reports" as Route,
  },
  {
    title: "Categories",
    description: "Curate the taxonomy applied at upload",
    icon: LayoutGridIcon,
    href: "/admin/taxonomy" as Route,
  },
  {
    title: "Tags",
    description: "Tune the free-form tags behind filters",
    icon: TagIcon,
    href: "/admin/taxonomy" as Route,
  },
  {
    title: "Users",
    description: "Accounts, roles, and bans",
    icon: UsersIcon,
    href: "/admin/users" as Route,
  },
  {
    title: "Collections",
    description: "Build sets, packs, and playlists of wallpapers",
    icon: FolderOpenIcon,
    href: "/admin/collections" as Route,
  },
  {
    title: "Featured",
    description: "Hero, trending, and seasonal placements",
    icon: SparklesIcon,
    href: "/admin/featured" as Route,
  },
  {
    title: "Analytics",
    description: "Platform growth and engagement metrics",
    icon: BarChart3Icon,
    href: "/admin/analytics" as Route,
  },
];

const DashboardLinks = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {modules.map((module) => (
        <Link
          key={module.title}
          href={module.href}
          aria-label={`${module.title}: ${module.description}`}
          className="group focus-visible:ring-ring/50 block rounded-4xl focus-visible:ring-[3px]">
          <Card className="hover:ring-foreground/10 h-full transition-all duration-200 group-hover:shadow-lg group-hover:shadow-black/20">
            <CardContent>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <span className="bg-muted/60 text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <module.icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{module.title}</span>
                </div>
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {module.description}
                </p>
                <span
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "pointer-events-none -ml-2 w-fit px-2",
                  })}>
                  <span>Open</span>
                  <ArrowRightIcon
                    data-icon="inline-end"
                    className="size-4"
                  />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default DashboardLinks;
