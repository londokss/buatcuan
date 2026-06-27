import { ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type BackButtonBaseProps = {
  label?: string;
  className?: string;
};

type BackButtonProps =
  | (BackButtonBaseProps & { to: LinkProps["to"]; onClick?: never } & Omit<LinkProps, "to" | "className" | "children">)
  | (BackButtonBaseProps & { to?: never; onClick: ButtonHTMLAttributes<HTMLButtonElement>["onClick"] } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "onClick">);

const backButtonClass =
  "inline-flex h-10 max-w-full items-center gap-2 rounded-2xl px-3 text-sm font-black text-muted-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

export function BackButton({ label = "Kembali", className, ...props }: BackButtonProps) {
  const content = (
    <>
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </>
  );

  if ("to" in props) {
    const { to, ...linkProps } = props;
    return (
      <Link to={to} className={cn(backButtonClass, className)} {...linkProps}>
        {content}
      </Link>
    );
  }

  const { onClick, type = "button", ...buttonProps } = props;
  return (
    <button type={type} onClick={onClick} className={cn(backButtonClass, className)} {...buttonProps}>
      {content}
    </button>
  );
}
