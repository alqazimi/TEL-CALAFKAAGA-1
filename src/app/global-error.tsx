"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "linear-gradient(180deg, #faf8f9 0%, #f3eef0 100%)",
          color: "#1a1a1a",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#E91E63",
              opacity: 0.35,
              margin: 0,
            }}
          >
            !
          </p>
          <h1 style={{ fontSize: 28, margin: "16px 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "#666", lineHeight: 1.6, margin: "0 0 24px" }}>
            An unexpected error occurred. Please try again or return to the homepage.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#E91E63",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 20px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: "12px 20px",
                fontWeight: 600,
                color: "#1a1a1a",
                textDecoration: "none",
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
