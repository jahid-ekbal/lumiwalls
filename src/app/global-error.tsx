"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
};

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}>
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            border: "1px solid #27272a",
            borderRadius: "12px",
            padding: "24px",
            background: "#18181b",
          }}>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "20px",
            }}>
            Something went wrong
          </h1>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "14px",
              color: "#a1a1aa",
            }}>
            The app shell failed to load. Please try again.
          </p>
          {error.digest ?
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "12px",
                color: "#71717a",
              }}>
              Reference: {error.digest}
            </p>
          : null}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}>
            <button
              type="button"
              onClick={() => reset?.()}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #fafafa",
                background: "#fafafa",
                color: "#09090b",
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
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #52525b",
                background: "transparent",
                color: "#fafafa",
                cursor: "pointer",
              }}>
              Return home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
