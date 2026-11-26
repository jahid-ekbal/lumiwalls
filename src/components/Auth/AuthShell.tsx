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
import prisma from "@/lib/database/dbClient";
import { toImagePath } from "@/lib/imageUrl";
import { SparklesIcon } from "lucide-react";
import type { ReactNode } from "react";

type ShowcaseItem = {
  id: string;
  title: string;
  thumb800Url: string | null;
  thumb400Url: string | null;
  category: { name: string } | null;
};

async function loadShowcase(): Promise<ShowcaseItem[]> {
  try {
    return await prisma.wallpaper.findMany({
      where: { isApproved: true, isPublic: true },
      orderBy: [{ featured: "desc" }, { editorsPick: "desc" }, { viewCount: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        thumb800Url: true,
        thumb400Url: true,
        category: { select: { name: true } },
      },
    });
  } catch {
    return [];
  }
}

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

const AuthShell = async ({
  title,
  description,
  children,
  footer,
}: AuthShellProps) => {
  const showcase = await loadShowcase();
  const lead = showcase[0];
  const secondary = showcase.slice(1, 3);
  const leadSrc = lead ? toImagePath(lead.thumb800Url ?? lead.thumb400Url) : null;

  return (
    <div className="bg-background relative isolate min-h-dvh overflow-hidden">
      <AmbientBackground />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggleButton />
      </div>

      <main className="mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,26rem)] lg:gap-12">
        {/* Desktop brand & gallery showcase panel */}
        <section
          aria-label="Lumiwalls gallery overview"
          className="hidden flex-col justify-between gap-8 lg:flex">
          <div className="grid gap-4">
            <Brand className="w-fit justify-start" />
            <p className="text-eyebrow text-muted-foreground font-medium uppercase">
              Curated wallpaper gallery
            </p>
            <h1 className="font-heading text-display max-w-lg font-semibold tracking-tight text-balance">
              Light up your screen.
            </h1>
            <p className="text-body-sm text-muted-foreground max-w-md leading-relaxed text-pretty">
              Every wallpaper in Lumiwalls is reviewed for sharpness, aspect
              clarity, and restraint before it reaches the gallery.
            </p>
          </div>

          {leadSrc ?
            <div className="grid gap-3">
              <figure className="border-border/60 bg-card/60 relative aspect-16/9 overflow-hidden rounded-surface border shadow-2xl shadow-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={leadSrc}
                  alt={lead?.title ?? "Featured gallery wallpaper"}
                  className="size-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4 pt-12 text-white">
                  <span className="text-body-sm truncate font-medium">
                    {lead?.title}
                  </span>
                  {lead?.category ?
                    <span className="text-caption shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 backdrop-blur-sm">
                      {lead.category.name}
                    </span>
                  : null}
                </figcaption>
              </figure>

              {secondary.length > 0 ?
                <div className="grid grid-cols-2 gap-3">
                  {secondary.map((item) => {
                    const src = toImagePath(item.thumb400Url ?? item.thumb800Url);
                    if (!src) {
                      return null;
                    }
                    return (
                      <figure
                        key={item.id}
                        className="border-border/60 bg-card/60 relative aspect-16/10 overflow-hidden rounded-inset border shadow-lg shadow-black/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={item.title}
                          className="size-full object-cover"
                        />
                        <figcaption className="text-caption absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-3 py-2 text-white/90">
                          {item.title}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              : null}
            </div>
          : <div className="border-border/60 bg-card/40 relative overflow-hidden rounded-surface border p-8 backdrop-blur-sm">
              <div className="grid gap-3">
                <span className="bg-muted/80 text-muted-foreground ring-border/60 inline-flex size-10 items-center justify-center rounded-full ring-1">
                  <SparklesIcon
                    aria-hidden="true"
                    className="size-4"
                  />
                </span>
                <p className="font-heading text-h2 font-medium">
                  Crafted for high-DPI displays
                </p>
                <p className="text-body-sm text-muted-foreground max-w-md">
                  Browse by orientation, dominant color, and curated collections.
                  Preview full-resolution frames before you download.
                </p>
              </div>
            </div>
          }
        </section>

        {/* Auth card */}
        <section
          aria-label={title}
          className="mx-auto w-full max-w-md">
          <Card className="border-border/70 bg-card/85 shadow-2xl shadow-black/30 backdrop-blur-md">
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
