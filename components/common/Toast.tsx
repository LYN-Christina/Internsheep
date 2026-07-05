interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {message}
    </section>
  );
}
