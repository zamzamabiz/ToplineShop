import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-[var(--text-inverse)] hover:opacity-90",
        destructive:
          "text-white hover:opacity-90",
        outline: "hover:opacity-80",
        secondary: "hover:opacity-80",
        ghost: "hover:opacity-80",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: { backgroundColor: "var(--brand-primary)" },
  destructive: { backgroundColor: "var(--state-danger)" },
  outline: {
    border: "1px solid var(--border-default)",
    backgroundColor: "transparent",
    color: "var(--text-primary)",
  },
  secondary: {
    backgroundColor: "var(--surface-secondary)",
    color: "var(--text-primary)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
  },
  link: {
    backgroundColor: "transparent",
    color: "var(--brand-primary)",
  },
};

export function Button({ className, variant = "default", size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      style={variantStyles[variant] || variantStyles.default}
      {...props}
    />
  );
}
