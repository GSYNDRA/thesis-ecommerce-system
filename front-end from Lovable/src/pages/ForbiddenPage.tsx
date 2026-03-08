import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold">403 - Forbidden</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        You do not have permission to access this page.
      </p>
      <div className="mt-6">
        <Link className="text-sm underline" to="/">
          Return to home
        </Link>
      </div>
    </main>
  );
}

