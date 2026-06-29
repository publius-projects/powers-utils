"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = { path: string; label: string }

export function NavBar({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="mt-4 flex gap-1 sm:gap-2 flex-nowrap justify-center" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`text-[10px] sm:text-xs tracking-wider px-2 sm:px-3 py-1 sm:py-1.5 transition-opacity bg-foreground text-background hover:opacity-80 ${
            pathname === item.path ? "opacity-100" : "opacity-70"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
