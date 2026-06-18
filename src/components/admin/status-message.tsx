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
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
