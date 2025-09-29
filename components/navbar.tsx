"use client"
import { BookOpen } from "lucide-react"
import { SettingsMenu } from "@/components/settings-menu"
import { type Language, useTranslation } from "@/lib/i18n"
import Link from "next/link"

interface NavbarProps {
  language: Language
  onLanguageChange: (language: Language) => void
}

export function Navbar({ language, onLanguageChange }: NavbarProps) {
  const t = useTranslation(language)

  return (
    <header className="border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-2xl font-bold">{t.appName}</h1>
          </Link>
          <SettingsMenu language={language} onLanguageChange={onLanguageChange} />
        </div>
      </div>
    </header>
  )
}
