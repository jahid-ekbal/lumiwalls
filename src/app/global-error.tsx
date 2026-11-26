"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const GlobalError = ({
  error,
  reset,
  unstable_retry,
}: GlobalErrorProps) => {
  const handleRetry = () => {
    if (unstable_retry) {
      unstable_retry();
    } else if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <html
      lang="en"
      className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          backgroundColor: "#111111",
          backgroundImage:
            "radial-gradient(48rem 24rem at 18% 22%, rgba(110, 120, 210, 0.08), transparent 65%), radial-gradient(42rem 22rem at 85% 8%, rgba(80, 160, 190, 0.05), transparent 60%)",
          color: "#fafafa",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}>
        <main
          role="alert"
          style={{
            width: "100%",
            maxWidth: "480px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "26px",
            padding: "28px",
            background: "rgba(30, 30, 30, 0.92)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
          }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#a3a3a3",
            }}>
            Lumiwalls
          </p>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "24px",
              lineHeight: 1.2,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}>
            Something went wrong
          </h1>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "#a3a3a3",
            }}>
            The application shell could not load. Please retry or return to the
            start page.
          </p>
          {error.digest ?
            <p
              style={{
                margin: "0 0 18px",
                fontSize: "12px",
                fontFamily: "ui-monospace, monospace",
                color: "#737373",
              }}>
              Reference: {error.digest}
            </p>
          : null}
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}>
            <button
              type="button"
              onClick={handleRetry}
              style={{
                padding: "9px 18px",
                borderRadius: "9999px",
                border: "1px solid #ebebeb",
                background: "#ebebeb",
                color: "#191919",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}>
              Try again
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              style={{
                padding: "9px 18px",
                borderRadius: "9999px",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                background: "transparent",
                color: "#fafafa",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}>
              Return home
            </button>
          </div>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
