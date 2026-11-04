"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Wordmark } from "@/components/wordmark";
import type { Role } from "@/lib/types";

function Icon({ name }: { name: "sun" | "bowl" | "bar" | "ruler" | "people" }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "sun") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
      </svg>
    );
  }
  if (name === "bowl") {
    return (
      <svg {...props}>
        <path d="M4 10h16c0 5-3.2 8-8 8s-8-3-8-8z" />
        <path d="M8 10c.4-2 1.6-3 4-3s3.6 1 4 3" />
      </svg>
    );
  }
  if (name === "bar") {
    return (
      <svg {...props}>
        <path d="M8 12h8" />
        <circle cx="6" cy="12" r="2.2" />
        <circle cx="18" cy="12" r="2.2" />
      </svg>
    );
  }
  if (name === "people") {
    return (
      <svg {...props}>
        <circle cx="9" cy="8" r="2.2" />
        <circle cx="16" cy="9" r="1.8" />
        <path d="M4.5 18c.6-2.4 2.4-3.6 4.5-3.6S13 15.6 13.6 18" />
        <path d="M13 18c.3-1.6 1.4-2.6 3-2.6 1.5 0 2.6.8 3.1 2.6" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M7 4h10v16H7z" />
      <path d="M7 8h4M7 12h4M7 16h4" />
    </svg>
  );
}

const clientLinks = [
  { href: "/hoy", label: "Hoy", icon: "sun" as const },
  { href: "/dieta", label: "Dieta", icon: "bowl" as const },
  { href: "/entreno", label: "Entreno", icon: "bar" as const },
  { href: "/ficha", label: "Ficha", icon: "ruler" as const },
];

export function PanelNav({
  role,
  name,
  needsFicha,
}: {
  role: Role;
  name: string;
  needsFicha: boolean;
}) {
  const pathname = usePathname();
  const links =
    role === "admin"
      ? [{ href: "/estudio", label: "Clientes", icon: "people" as const }]
      : needsFicha
        ? clientLinks.filter((link) => link.href === "/ficha")
        : clientLinks;

  return (
    <aside className="sidenav">
      <Wordmark href={role === "admin" ? "/estudio" : "/hoy"} variant="full" />
      <nav aria-label="Panel">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link key={link.href} href={link.href} className="nav-link" aria-current={active ? "page" : undefined}>
              <Icon name={link.icon} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidenav-foot">
        <p>{name || "Cuenta"}</p>
        <form action={signOut}>
          <button className="btn btn-ghost" type="submit">
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
