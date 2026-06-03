import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-wider text-primary mb-2">404</p>
        <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Back to Nova OPS
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nova OPS — AI operations for founders" },
      { name: "description", content: "LaunchPad tools and Nova OS automations to help founders activate, operate, and scale faster." },
      { property: "og:title", content: "Nova OPS — AI operations for founders" },
      { property: "og:description", content: "LaunchPad tools and Nova OS automations to help founders activate, operate, and scale faster." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Nova OPS — AI operations for founders" },
      { name: "twitter:description", content: "LaunchPad tools and Nova OS automations to help founders activate, operate, and scale faster." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b8f805ff-4ca2-454f-b3e5-3827a803af75/id-preview-ab66c79c--81ad2514-e4a9-4db0-a993-3f9e2a3e87b9.lovable.app-1780507297087.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b8f805ff-4ca2-454f-b3e5-3827a803af75/id-preview-ab66c79c--81ad2514-e4a9-4db0-a993-3f9e2a3e87b9.lovable.app-1780507297087.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body className="bg-background text-foreground">
        {children}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}
