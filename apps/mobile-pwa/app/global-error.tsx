"use client";

/** Requis pour l’export statique (`output: "export"`) : évite l’échec de prerendu sur `/_global-error`. */
export default function GlobalError(p: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <h2>Something went wrong.</h2>
        <button type="button" onClick={() => p.reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
