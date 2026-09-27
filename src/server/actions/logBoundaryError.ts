"use server";

type LogBoundaryErrorInput = {
  route: string;
  digest?: string;
  message: string;
  stack?: string;
};

export async function logBoundaryError(
  input: LogBoundaryErrorInput,
): Promise<void> {
  console.error(
    JSON.stringify({
      scope: "route-boundary",
      route: input.route,
      digest: input.digest ?? "none",
      message: input.message,
      stack: input.stack ?? "none",
    }),
  );
}
