type ToastType = "success" | "error" | "warning"

export function showToast(message: string, type: ToastType = "success") {
  const event = new CustomEvent('show-toast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
} 