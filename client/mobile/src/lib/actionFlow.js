import { useEffect, useState } from "react";

let listeners = [];
let currentState = { visible: false };

function emit(state) {
  currentState = state;
  listeners.forEach((l) => l(currentState));
}

export function useActionFlowState() {
  const [state, setState] = useState(currentState);
  useEffect(() => {
    listeners.push(setState);
    return () => { listeners = listeners.filter((l) => l !== setState); };
  }, []);
  return state;
}

function close() {
  emit({ visible: false });
}

/**
 * confirm -> loading -> success/error, promise-based.
 * onConfirm should return a Promise (your API call).
 */
function confirm({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  loadingMessage = "Please wait...",
  successTitle = "Done!",
  successMessage = "",
  onConfirm,
}) {
  return new Promise((resolve) => {
    emit({
      visible: true,
      phase: "confirm",
      title,
      message,
      confirmText,
      cancelText,
      destructive,
      onCancel: () => {
        close();
        resolve({ confirmed: false });
      },
      onConfirmPress: async () => {
        emit({ visible: true, phase: "loading", title: loadingMessage });
        try {
          const result = await onConfirm?.();
          emit({ visible: true, phase: "success", title: successTitle, message: successMessage });
          setTimeout(() => {
            close();
            resolve({ confirmed: true, result });
          }, 1100);
        } catch (e) {
          emit({
            visible: true,
            phase: "error",
            title: "Something went wrong",
            message: e?.message || "Please try again.",
            onDismiss: () => {
              close();
              resolve({ confirmed: true, error: e });
            },
          });
        }
      },
    });
  });
}

export const ActionFlow = { confirm, close };