// src/utils/date.ts
/**
 * Formats an ISO date string or Date object into a more readable format.
 * @param dateInput Date object or ISO string
 * @returns Formatted date string (e.g., "Apr 30, 2025") or 'Invalid Date'
 */
export const formatDate = (
  dateInput: string | Date | undefined | null
): string => {
  if (!dateInput) return "N/A"; // Handle null or undefined input

  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    // Check if the date is valid after parsing/creation
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    // Use 'en-CA' for consistency, adjust options as needed
    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short", // e.g., 'Apr'
      day: "numeric",
    });
  } catch (e) {
    console.error("Error formatting date:", dateInput, e);
    return "Invalid Date";
  }
};
