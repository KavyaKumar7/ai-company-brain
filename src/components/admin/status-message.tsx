import { AlertCircle, CheckCircle2 } from "lucide-react";

type StatusMessageProps = {
  error?: string;
  message?: string;
};

export function StatusMessage({ error, message }: StatusMessageProps) {
  if (!error && !message) {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/[0.08] px-3.5 py-3 text-sm text-destructive" role="alert">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-3.5 py-3 text-sm text-emerald-300" role="status">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
