import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="empty" style={{ minHeight: "100vh", display: "grid", placeContent: "center" }}>
      <strong style={{ fontSize: 22 }}>Page not found</strong>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <div>
        <Link to="/" className="btn primary">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="empty" style={{ minHeight: "100vh", display: "grid", placeContent: "center" }}>
      <strong style={{ fontSize: 18 }}>This page didn't load</strong>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div className="form-actions" style={{ justifyContent: "center" }}>
        <button
          className="btn primary"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </button>
        <a href="/" className="btn">
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width,initial-scale=1" },
      { title: "Payable Control" },
      {
        name: "description",
        content: "Track invoices, approvals, and payment status in one place.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
