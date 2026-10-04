import { addSeconds, differenceInSeconds, subHours } from "date-fns";

export const getPresignedExpiryDate = (expiresInSeconds: number): Date =>
  addSeconds(new Date(), expiresInSeconds);

export const getRemainingSeconds = (expiresAt: Date): number =>
  Math.max(0, differenceInSeconds(expiresAt, new Date()));

export const getOneHourAgo = (): Date => subHours(new Date(), 1);
