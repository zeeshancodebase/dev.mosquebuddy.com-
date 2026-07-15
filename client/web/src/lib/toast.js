// src/lib/toast.js
import toast from "react-hot-toast";

export const notify = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  loading: (message) => toast.loading(message),
  dismiss: (id) => toast.dismiss(id),

  // For async operations — shows loading then success/error
  promise: (promise, messages) =>
    toast.promise(promise, {
      loading: messages.loading || "Saving...",
      success: messages.success || "Saved successfully",
      error: (err) => err?.message || messages.error || "Something went wrong",
    }),
};