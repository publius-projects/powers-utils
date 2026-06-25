import Link from "next/link"
import { SignupForm } from "./form"
import { NavBar } from "./NavBar"
import { getConstants } from "@/context/constants"

const { CULTURAL_STEWARDSHIP_WEBSITE: site } = getConstants(11155111)
const baseUrl = site ? `https://${site}` : ""

const navItems = [
  { path: `${baseUrl}/`, label: "ABOUT" },
  { path: `${baseUrl}/door`, label: "DOOR" },
  { path: `${baseUrl}/sessions`, label: "SESSIONS" },
  { path: `${baseUrl}/garments`, label: "GARMENTS" },
  { path: `${baseUrl}/correspondence`, label: "CORRESPONDENCE" },
]

type Props = {
  searchParams: Promise<{ index?: string }>
}

export default async function CSSignupPage({ searchParams }: Props) {
  const params = await searchParams
  const raw = params.index
  const preselectedIndex = raw !== undefined && /^\d+$/.test(raw) ? parseInt(raw, 10) : undefined

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center text-center bg-background text-foreground">
      <header className="w-full border-b-2 border-foreground">
        <div className="container max-w-full py-6 flex flex-col items-center justify-center gap-2">
          <Link href={`${baseUrl}/`} className="inline-block hover:opacity-60 transition-opacity">
            <video src="/videos/ascii-art-2.mp4" autoPlay loop muted playsInline className="max-w-[200px] mx-auto w-full" />
          </Link>
          <NavBar navItems={navItems} />
        </div>
      </header>

      <main className="flex-1 container max-w-4xl py-12">
        <SignupForm preselectedIndex={preselectedIndex} />
      </main>

      <footer className="w-full border-t-2 border-foreground">
        <div className="container max-w-full py-6 flex flex-col items-center justify-center text-center">
          <div className="text-xs opacity-50" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            This work is shared under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
          </div>
        </div>
      </footer>
    </div>
  )
}
