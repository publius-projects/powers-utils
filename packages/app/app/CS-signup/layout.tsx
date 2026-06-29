"use client"

import { ThemeProvider } from "next-themes"

export default function CSSignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light">
      {children}
    </ThemeProvider>
  )
}
