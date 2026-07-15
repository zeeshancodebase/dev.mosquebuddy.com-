// src/lib/confirmAction.js
import Swal from "sweetalert2";

/**
 * Shows a swal confirm dialog, runs `action` on confirm with loading state,
 * and surfaces any thrown error inline in the same dialog.
 *
 * Returns { confirmed: boolean } — confirmed is true only if the user
 * confirmed AND the action succeeded.
 */
export async function confirmAction({
  title,
  text,
  icon = "warning",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  action,
}) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      try {
        return await action();
      } catch (err) {
        Swal.showValidationMessage(
          err?.response?.data?.message || "Something went wrong. Please try again."
        );
        return false;
      }
    },
  });

  return { confirmed: result.isConfirmed };
}