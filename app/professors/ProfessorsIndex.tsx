"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Search, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/settings";
import { useTranslation } from "@/lib/i18n";
import { filterProfessors, professorHref, professorInitials } from "@/lib/professor-search";
import { ProfessorsPageLayout } from "./ProfessorsPageLayout";

interface ProfessorsIndexProps {
  professors: string[];
}

export function ProfessorsIndex({ professors }: ProfessorsIndexProps) {
  const [language, setLanguage] = useLanguage();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const searchRef = useRef<HTMLInputElement>(null);
  const t = useTranslation(language);

  // Restore shared links and Back/Forward navigation. Typing updates local
  // state immediately while Next syncs the native history update.
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const visible = useMemo(() => filterProfessors(professors, query), [professors, query]);

  const updateQuery = (value: string) => {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    // Keep one history entry for the search, without refetching the timetable.
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const clearSearch = () => {
    updateQuery("");
    searchRef.current?.focus();
  };

  return (
    <ProfessorsPageLayout language={language} onLanguageChange={setLanguage}>
      <section aria-label={t.professorSearchLabel} className="mb-4 rounded-2xl border bg-card">
        <div className="p-3">
          <div className="relative">
            <label htmlFor="professor-search" className="sr-only">
              {t.professorSearchLabel}
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={searchRef}
              id="professor-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={t.professorSearchPlaceholder}
              aria-controls="professor-results"
              className="h-[42px] rounded-[10px] pl-9 pr-11 text-base sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label={t.clearProfessorSearch}
                className="absolute right-0 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <p role="status" aria-atomic="true" className="border-t px-3 py-2.5 text-sm text-muted-foreground">
          <strong className="text-foreground">{visible.length}</strong>{" "}
          {visible.length === 1 ? t.professorFound : t.professorsFound}
        </p>
      </section>

      <div id="professor-results">
        {visible.length === 0 ? (
          <section className="rounded-2xl border bg-card px-5 py-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-bold">
              {professors.length === 0 ? t.professorsNotPublished : t.professorsEmpty}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {professors.length === 0 ? t.professorsNotPublishedHint : t.professorsEmptyHint}
            </p>
            {query && professors.length > 0 && (
              <button
                type="button"
                onClick={clearSearch}
                className="mt-4 min-h-11 rounded-[10px] bg-free-soft px-4 text-sm font-semibold text-free-soft-foreground hover:bg-free-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t.clearProfessorSearch}
              </button>
            )}
          </section>
        ) : (
          <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((name) => (
              <li key={name} className="min-w-0">
                <Link
                  href={professorHref(name, query)}
                  prefetch={false}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-free-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="flex flex-1 items-center gap-3 p-4">
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-free-soft text-sm font-extrabold text-free-soft-foreground">
                      {professorInitials(name)}
                    </span>
                    <h2 className="min-w-0 break-words text-base font-bold">{name}</h2>
                  </div>
                  <span className="flex min-h-11 items-center justify-between gap-2 border-t bg-free-tint px-4 py-2.5 text-sm font-semibold text-free-soft-foreground group-hover:bg-free-soft">
                    {t.viewProfessorSchedule}
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ProfessorsPageLayout>
  );
}
