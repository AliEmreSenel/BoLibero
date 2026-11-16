"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Clipboard,
  ExternalLink,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { MAX_CLASSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { fill, useTranslation } from "@/lib/i18n";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  SAVED_CLASSES_KEY,
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
  useLanguage,
} from "@/lib/settings";

interface ClassOption {
  id: string;
  code: string;
  section: string;
  title: string;
  teachers?: string[];
  meetings?: Array<{ day: number; start: string }>;
}

export default function CalendarBuilder() {
  const [language, setLanguage] = useLanguage();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selected, setSelected] = useState<ClassOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [copiedList, setCopiedList] = useState(false);
  const searchParams = useSearchParams();
  const [reloadKey, setReloadKey] = useState(0);
  const t = useTranslation(language);

  useEffect(() => {
    setOrigin(window.location.origin);

    try {
      const saved = JSON.parse(safeGetItem(SAVED_CLASSES_KEY) || "[]");
      if (Array.isArray(saved)) setSelected(saved.slice(0, MAX_CLASSES));
    } catch {
      safeRemoveItem(SAVED_CLASSES_KEY);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const requestedIds = searchParams.getAll("class");
    fetch("/api/classes", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Class catalog request failed");
        return response.json();
      })
      .then((data) => {
        const list: ClassOption[] = Array.isArray(data.classes) ? data.classes : [];
        setClasses(list);
        if (requestedIds.length > 0) {
          const byId = new Map(list.map((item) => [item.id, item]));
          setSelected((current) => {
            const ids = new Set(current.map((item) => item.id));
            const merged = [...current];
            for (const id of requestedIds) {
              const found = byId.get(id);
              if (found && !ids.has(found.id)) {
                ids.add(found.id);
                merged.push(found);
              }
            }
            return merged.slice(0, MAX_CLASSES);
          });
        }
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") setError(t.classCatalogError);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [reloadKey, searchParams, t.classCatalogError]);

  useEffect(() => {
    safeSetItem(SAVED_CLASSES_KEY, JSON.stringify(selected));
  }, [selected]);

  const selectedIds = useMemo(
    () => new Set(selected.map((item) => item.id)),
    [selected]
  );
  const matches = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return classes.filter((item) => {
      const searchable = `${item.code} ${item.section} ${item.title}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }, [classes, query]);
  const visibleClasses = useMemo(() => matches.slice(0, 100), [matches]);
  const capReached = selected.length >= MAX_CLASSES;

  const subscriptionUrl = useMemo(() => {
    if (!origin || selected.length === 0) return "";
    const url = new URL("/api/calendar.ics", origin);
    [...selected]
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach((item) => url.searchParams.append("class", item.id));
    return url.toString();
  }, [origin, selected]);
  const webcalUrl = subscriptionUrl.replace(/^https?:/, "webcal:");

  const toggleClass = (item: ClassOption) => {
    setCopied(false);
    setSubscribed(false);
    setSelected((current) => {
      if (current.some((selectedClass) => selectedClass.id === item.id)) {
        return current.filter((selectedClass) => selectedClass.id !== item.id);
      }
      if (current.length >= MAX_CLASSES) return current;
      return [...current, item];
    });
  };

  const copyUrl = async () => {
    if (!subscriptionUrl) return;
    await navigator.clipboard.writeText(subscriptionUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  const copyListLink = async () => {
    if (!origin || selected.length === 0) return;
    const url = new URL("/calendar", origin);
    [...selected]
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach((item) => url.searchParams.append("class", item.id));
    await navigator.clipboard.writeText(url.toString());
    setCopiedList(true);
    window.setTimeout(() => setCopiedList(false), 2500);
  };

  const subscribeBand = "flex min-h-12 items-center justify-between gap-2 px-4 font-bold";
  const locale = language === "it" ? it : enUS;
  // 1 Jan 2024 is a Monday; day is 0 = Sunday … 6 = Saturday.
  const weekday = (day: number) =>
    format(new Date(2024, 0, 1 + ((day + 6) % 7)), "EEE", { locale });
  const classSummary = (item: ClassOption) =>
    [
      (item.teachers ?? []).join(", "),
      // Back-to-back double sessions share a day: "Mon 16:30/18:15, Thu 13:00".
      (item.meetings ?? [])
        .reduce<Array<{ day: number; starts: string[] }>>((days, meeting) => {
          const last = days[days.length - 1];
          if (last && last.day === meeting.day) last.starts.push(meeting.start);
          else days.push({ day: meeting.day, starts: [meeting.start] });
          return days;
        }, [])
        .map(({ day, starts }) => `${weekday(day)} ${starts.join("/")}`)
        .join(", "),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <PageLayout language={language} onLanguageChange={setLanguage}>
      <div className="mx-auto w-full max-w-[1240px] px-3 py-5 sm:px-6">
        <div className="mb-3.5">
          <h1 className="text-2xl font-extrabold tracking-tight">{t.classCalendarTitle}</h1>
          <p className="max-w-3xl text-muted-foreground">{t.classCalendarDescription}</p>
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <section
            aria-label={t.chooseClasses}
            className="min-w-0 flex-[999_1_560px] overflow-hidden rounded-2xl border bg-card"
          >
            <div className="border-b p-3">
              <div className="relative">
                <label htmlFor="class-search" className="sr-only">
                  {t.chooseClasses}
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  id="class-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.classSearchPlaceholder}
                  className="h-[42px] w-full rounded-[10px] border border-input bg-background pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t.chooseClassesDescription}</p>
            </div>

            {loading ? (
              <div role="status" className="flex min-h-56 items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.loadingClasses}
              </div>
            ) : error ? (
              <div role="alert" className="m-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
                  {t.refresh}
                </Button>
              </div>
            ) : (
              <div className="lg:max-h-[640px] lg:overflow-y-auto">
                <ul>
                  {visibleClasses.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const isDisabled = !isSelected && capReached;
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 border-b px-3 py-2.5",
                          isSelected && "bg-free-tint"
                        )}
                      >
                        <span className="hidden min-w-[58px] shrink-0 rounded-[7px] bg-muted px-1.5 py-0.5 text-center text-[13px] font-bold tabular-nums sm:inline">
                          {item.code}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate">
                            <strong>{item.title}</strong>{" "}
                            <span className="text-muted-foreground">· {item.section}</span>
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            <span className="sm:hidden">
                              {item.code}
                              {classSummary(item) ? " · " : ""}
                            </span>
                            {classSummary(item)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleClass(item)}
                          aria-pressed={isSelected}
                          aria-label={`${isSelected ? t.removeClass : t.addClass}: ${item.title} ${item.section}`}
                          disabled={isDisabled}
                          className={cn(
                            "inline-flex min-h-9 min-w-[72px] shrink-0 items-center justify-center gap-1 rounded-[10px] border px-3 text-sm font-bold disabled:opacity-50",
                            isSelected
                              ? "border-free bg-free text-free-foreground"
                              : "border-input bg-card hover:bg-muted"
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                          {isSelected ? t.addedClass : t.addClass}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {capReached && (
                  <p className="m-3 rounded-xl border border-free-tint-border bg-free-tint p-3 text-sm text-free-soft-foreground">
                    {t.capReached.replace("{max}", String(MAX_CLASSES))}
                  </p>
                )}
                {matches.length > 100 && (
                  <p className="p-3 text-xs text-muted-foreground">{t.first100Note}</p>
                )}
                {visibleClasses.length === 0 && (
                  <p role="status" className="py-12 text-center text-muted-foreground">
                    {t.noClassesFound}
                  </p>
                )}
              </div>
            )}
          </section>

          <aside className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
            <section aria-label={t.yourBundle} className="rounded-2xl border bg-card px-4 py-3.5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-extrabold">{t.yourBundle}</h2>
                <span className="text-muted-foreground tabular-nums">
                  <strong className="text-foreground">{selected.length}</strong> / {MAX_CLASSES}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={t.yourBundle}
                aria-valuemin={0}
                aria-valuemax={MAX_CLASSES}
                aria-valuenow={selected.length}
                className="mb-2.5 mt-2 h-1.5 overflow-hidden rounded-full bg-track"
              >
                <div className="h-full bg-free-bar" style={{ width: `${(selected.length / MAX_CLASSES) * 100}%` }} />
              </div>
              {selected.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.emptyBundle}</p>
              ) : (
                <>
                  <ul>
                    {selected.map((item) => (
                      <li key={item.id} className="flex min-h-[38px] items-center gap-2.5 border-t">
                        <span className="text-xs font-bold text-muted-foreground tabular-nums">{item.code}</span>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {item.title} · {item.section}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleClass(item)}
                          aria-label={`${t.removeClass}: ${item.title} ${item.section}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={copyListLink}
                    className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-free-soft-foreground hover:underline"
                  >
                    {copiedList ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    {copiedList ? t.copied : t.shareClassList}
                  </button>
                  <p className="text-xs text-muted-foreground">{t.shareClassListHelp}</p>
                </>
              )}
            </section>

            <section
              aria-label={t.subscribeCalendar}
              className={cn(
                "overflow-hidden rounded-2xl border bg-card",
                subscriptionUrl ? "border-free-border" : ""
              )}
            >
              <div className="flex flex-col gap-2.5 px-4 py-3.5">
                <h2 className="text-base font-extrabold">{t.subscribeCalendar}</h2>
                <p className="text-sm text-muted-foreground">{t.subscribeDescription}</p>
                {subscriptionUrl && (
                  <div className="flex gap-1.5">
                    <label htmlFor="feed-url" className="sr-only">
                      {t.subscriptionUrlLabel}
                    </label>
                    <input
                      id="feed-url"
                      readOnly
                      value={subscriptionUrl}
                      onFocus={(event) => event.target.select()}
                      className="h-[38px] min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2.5 text-xs text-foreground"
                    />
                    <button
                      type="button"
                      onClick={copyUrl}
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-[10px] border border-input bg-card px-3 text-sm font-bold hover:bg-muted"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                      {copied ? t.copied : t.copySubscriptionUrl}
                    </button>
                  </div>
                )}
                {subscribed && subscriptionUrl && (
                  <p className="rounded-lg bg-free-tint p-2 text-xs text-free-soft-foreground">{t.webcalClicked}</p>
                )}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t.subscriptionHelp} {t.calendarCoverage}
                </p>
                {subscriptionUrl && (
                  <>
                    <p className="text-xs leading-relaxed text-muted-foreground">{t.resubscribeHint}</p>
                    <a
                      href={subscriptionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {t.previewCalendarFeed}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </>
                )}
              </div>
              {subscriptionUrl ? (
                <a
                  href={webcalUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setSubscribed(true)}
                  className={cn(subscribeBand, "bg-free text-free-foreground")}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    {t.openCalendarApp}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : (
                <span className={cn(subscribeBand, "bg-busy text-muted-foreground")}>{t.openCalendarApp}</span>
              )}
            </section>
          </aside>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t.disclaimer}</p>
        {subscriptionUrl && (
          <div className="sticky bottom-0 z-30 -mx-3 mt-4 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:-mx-6 lg:hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-muted-foreground">
              <span>{fill(t.classesSelected, { n: selected.length, max: MAX_CLASSES })}</span>
              <button
                type="button"
                onClick={copyUrl}
                className="min-h-8 rounded-lg border border-input bg-card px-2.5 font-semibold text-foreground"
              >
                {copied ? t.copied : t.copyFeedUrl}
              </button>
            </div>
            <a
              href={webcalUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setSubscribed(true)}
              className={cn(subscribeBand, "bg-free text-free-foreground")}
            >
              {t.openCalendarApp}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>

    </PageLayout>
  );
}
