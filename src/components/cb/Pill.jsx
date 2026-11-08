import { Link } from "react-router-dom";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-[15px] leading-none transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40";

const sizes = {
  sm: "h-10 px-5",
  md: "h-12 px-6",
  lg: "h-14 px-8",
};

const variants = {
  primary: "bg-ink text-[#d8d4cf] hover:bg-caramel hover:text-white",
  outline: "border-[1.5px] border-ink text-ink hover:border-caramel hover:text-caramel bg-transparent",
  ghost: "text-ink hover:text-caramel",
  light: "bg-white text-ink hover:bg-caramel hover:text-white",
  quiet: "border border-rule text-ink hover:border-ink bg-paper",
};

export default function Pill({
  as,
  to,
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }
  const Tag = as || "button";
  return (
    <Tag className={cls} {...props}>
      {children}
    </Tag>
  );
}