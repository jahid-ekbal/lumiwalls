export function adminActionErrorMessage(error: string): string {
  switch (error) {
    case "CANNOT_BAN_SELF":
      return "You cannot ban yourself";
    case "CANNOT_BAN_ADMIN":
      return "Admin accounts cannot be banned";
    case "CANNOT_DEMOTE_SELF":
      return "You cannot change your own role";
    case "CANNOT_DELETE_SELF":
      return "You cannot delete your own account";
    case "LAST_ADMIN":
      return "At least one admin must remain";
    case "PROTECTED_ADMIN":
      return "The primary admin account is protected";
    case "REASON_REQUIRED":
      return "A ban reason is required";
    case "UNAUTHORIZED":
      return "Your session expired. Sign in again.";
    case "FORBIDDEN":
      return "You do not have permission to do that";
    case "NOT_FOUND":
      return "That user no longer exists";
    default:
      return "Action failed";
  }
}
