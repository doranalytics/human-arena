/** Temporary testing switch. Set false to restore verified-email signup. */
export const TESTING_MODE = true;
export const SESSION_REQUIRED = TESTING_MODE
  ? "Your testing session expired. Refresh the page to continue."
  : "Sign in and verify your email to continue.";
