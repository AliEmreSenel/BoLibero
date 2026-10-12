"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarPlus,
  Check,
  Clipboard,
  ExternalLink,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { MAX_CLASSES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Language, useTranslation } from "@/lib/i18n";
import { getInitialLanguage, loadSettings, saveSettings } from "@/lib/settings";

interface ClassOption {
  id: string;
  code: string;
  section: string;
  title: string;
}

const SAVED_CLASSES_KEY = "bolibero-calendar-classes";

export default function CalendarBuilder() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selected, setSelected] = useState<ClassOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const searchParams = useSearchParams();
  const [reloadKey, setReloadKey] = useState(0);
  const t = useTranslation(language);

  useEffect(() => {
    setLanguage(loadSettings().language);
    setOrigin(window.location.origin);

    try {
      const saved = JSON.parse(
        window.localStorage.getItem(SAVED_CLASSES_KEY) || "[]"
      );
      if (Array.isArray(saved)) setSelected(saved.slice(0, MAX_CLASSES));
    } catch {
      window.localStorage.removeItem(SAVED_CLASSES_KEY);
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
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SAVED_CLASSES_KEY, JSON.stringify(selected));
    }
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

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    saveSettings({ ...loadSettings(), language: nextLanguage });
  };

  return (
    <PageLayout language={language} onLanguageChange={handleLanguageChange}>
      <div className="container mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <CalendarPlus className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">{t.classCalendarTitle}</h2>
          </div>
          <p className="max-w-3xl text-lg text-muted-foreground">
            {t.classCalendarDescription}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{t.chooseClasses}</CardTitle>
              <CardDescription>{t.chooseClassesDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.classSearchPlaceholder}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="flex min-h-56 items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.loadingClasses}
                </div>
              ) : error ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                  <span>{error}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReloadKey((key) => key + 1)}
                  >
                    {t.refresh}
                  </Button>
                </div>
              ) : (
                <div className="max-h-none space-y-2 pr-1 lg:max-h-[560px] lg:overflow-y-auto">
                  {visibleClasses.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    const isDisabled = !isSelected && capReached;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggleClass(item)}
                        aria-pressed={isSelected}
                        disabled={isDisabled}
                        className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                          isSelected ? "border-primary bg-primary/5" : ""
                        } ${isDisabled ? "opacity-50 hover:bg-transparent" : ""}`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{item.title}</span>
                            <Badge variant="secondary">
                              {t.classNo} {item.code}
                            </Badge>
                            <Badge variant="outline">{item.section}</Badge>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  {capReached && (
                    <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                      {t.capReached.replace("{max}", String(MAX_CLASSES))}
                    </p>
                  )}
                  {matches.length > 100 && (
                    <p className="text-xs text-muted-foreground">{t.first100Note}</p>
                  )}
                  {visibleClasses.length === 0 && (
                    <p className="py-12 text-center text-muted-foreground">
                      {t.noClassesFound}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{t.yourBundle}</CardTitle>
                  <Badge variant="secondary">
                    {selected.length}/{MAX_CLASSES}
                  </Badge>
                </div>
                <CardDescription>{t.yourBundleDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {selected.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t.emptyBundle}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selected.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-md bg-muted p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.code} · {item.section}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => toggleClass(item)}
                          aria-label={t.removeClass}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={selected.length ? "border-primary/50" : ""}>
              <CardHeader>
                <CardTitle>{t.subscribeCalendar}</CardTitle>
                <CardDescription>{t.subscribeDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={copyUrl}
                  disabled={!subscriptionUrl}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                  {copied ? t.copied : t.copySubscriptionUrl}
                </Button>
                {subscriptionUrl ? (
                  <Button asChild variant="outline" className="w-full">
                    <a
                      href={webcalUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setSubscribed(true)}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      {t.openCalendarApp}
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    <CalendarPlus className="h-4 w-4" />
                    {t.openCalendarApp}
                  </Button>
                )}
                {subscribed && subscriptionUrl && (
                  <p className="rounded-md border border-primary/20 bg-primary/5 p-2 text-xs text-muted-foreground">
                    {t.webcalClicked}
                  </p>
                )}
                {subscriptionUrl && (
                  <a
                    href={subscriptionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {t.previewCalendarFeed}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
                  {t.calendarCoverage}
                  <br />
                  {t.subscriptionHelp}
                </p>
                {subscriptionUrl && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t.resubscribeHint}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
