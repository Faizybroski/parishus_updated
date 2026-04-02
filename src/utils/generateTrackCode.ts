/**
 * Generates a short, unique, non-guessable track code for RSVP tracking.
 * Format: 8 characters, alphanumeric (uppercase + digits), e.g. "A7K3M9X2"
 * Easy to type manually if QR scanning fails.
 */
export const generateTrackCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  const length = 8;
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
};
