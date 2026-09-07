import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        backgroundColor: "var(--input-background)",
        borderColor: "var(--input-border)",
        color: "var(--text-primary)",
        ["--tw-ring-color" as string]: "var(--input-focus)",
      }}
      {...props}
    />
  );
}
