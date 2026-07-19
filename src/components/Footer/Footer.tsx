import type { Route } from "next";
import Link from "next/link";

const Footer = () => {
  return (
    <footer
      className="border-t"
      aria-label="app-footer">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} Lumiwalls. All rights reserved.
        </p>

        <nav className="text-muted-foreground flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link
            href={"/privacy" as Route}
            className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link
            href={"/terms" as Route}
            className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
