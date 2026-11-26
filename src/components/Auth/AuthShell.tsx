import AmbientBackground from "@/components/Ambient/AmbientBackground";
import Brand from "@/components/Brand/Brand";
import ThemeToggleButton from "@/components/Buttons/ThemeToggleButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  FolderHeartIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

const HIGHLIGHTS = [
  {
    icon: ShieldCheckIcon,
    title: "Curated moderation queue",
    detail: "Every wallpaper is reviewed for clarity, framing, and safe file validation.",
  },
  {
    icon: SlidersHorizontalIcon,
    title: "Aspect and color discovery",
    detail: "Filter by natural proportions, dominant palette hexes, tags, and creators.",
  },
  {
    icon: FolderHeartIcon,
    title: "Personal boards and sets",
    detail: "Pin favorites into private or member-shared boards with instant high-DPI downloads.",
  },
] as const;

const AuthShell = ({
  title,
  description,
  children,
  footer,
}: AuthShellProps) => {
  return (
    <div className="bg-background relative isolate min-h-dvh w-full overflow-hidden">
      <AmbientBackground />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggleButton />
      </div>

      <main className="grid min-h-dvh w-full items-center gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,28rem)] lg:gap-14 lg:px-14">
        <section
          aria-label="Lumiwalls gallery overview"
          className="hidden flex-col justify-between gap-8 lg:flex">
          <div className="grid gap-4">
            <Brand className="w-fit justify-start" />
            <h1 className="font-heading text-display max-w-2xl font-semibold tracking-tight text-balance">
              Light up your screen.
            </h1>
            <p className="text-body-sm text-muted-foreground max-w-xl leading-relaxed text-pretty">
              Lumiwalls is a private, curated wallpaper gallery built for
              high-resolution displays. Sign in to explore curated boards,
              creator streams, and full-size originals.
            </p>
          </div>

          <div className="border-border/70 bg-card/55 relative grid gap-5 overflow-hidden rounded-surface border p-7 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="bg-muted text-foreground ring-border/70 inline-flex size-10 items-center justify-center rounded-full ring-1">
                <SparklesIcon
                  aria-hidden="true"
                  className="size-4"
                />
              </span>
              <div>
                <p className="font-heading text-h2 font-medium">
                  Crafted for high-DPI displays
                </p>
                <p className="text-caption text-muted-foreground">
                  Members-only gallery with full resolution downloads
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.title}
                  className="border-border/60 bg-background/45 flex flex-col gap-2 rounded-inset border p-4">
                  <item.icon
                    aria-hidden="true"
                    className="text-foreground size-4"
                  />
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                  <p className="text-caption text-muted-foreground leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-label={title}
          className="mx-auto w-full max-w-md lg:max-w-none">
          <Card className="border-border/70 bg-card/90 backdrop-blur-md">
            <CardHeader className="gap-2 text-center">
              <Brand className="lg:hidden" />
              <CardTitle className="text-h2 font-semibold tracking-tight">
                {title}
              </CardTitle>
              <CardDescription className="text-pretty">
                {description}
              </CardDescription>
            </CardHeader>

            <CardContent>{children}</CardContent>

            {footer ?
              <CardFooter className="border-border/50 flex-col gap-2 border-t pt-5">
                {footer}
              </CardFooter>
            : null}
          </Card>
        </section>
      </main>
    </div>
  );
};

export default AuthShell;
