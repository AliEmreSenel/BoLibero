"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Download, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EXAMS_KEY, safeGetItem, safeSetItem, useLanguage } from "@/lib/settings";
import { formatDateFull, useTranslation } from "@/lib/i18n";

interface ExamItem {
  id: string;
  title: string;
  date: string;
  time: string;
  notes: string;
}

const icsEscape = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

const foldLine = (line: string) => {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    parts.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  parts.push(` ${rest}`);
  return parts.join("\r\n");
};

const nextDayKey = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return new Date(date.getTime() + 86_400_000).toISOString().slice(0, 10);
};

const buildIcs = (items: ExamItem[]) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BoLibero//Exams//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const item of items) {
    const date = item.date.replace(/-/g, "");
    if (item.time) {
      const time = item.time.replace(/:/g, "");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${item.id}@bolibero.it`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART:${date}T${time}00`,
        `SUMMARY:${icsEscape(item.title)}`,
        item.notes ? `DESCRIPTION:${icsEscape(item.notes)}` : "",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(`Reminder: ${item.title}`)}`,
        "TRIGGER:-P1D",
        "END:VALARM",
        "END:VEVENT"
      );
    } else {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${item.id}@bolibero.it`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART;VALUE=DATE:${date}`,
        `DTEND;VALUE=DATE:${nextDayKey(item.date).replace(/-/g, "")}`,
        `SUMMARY:${icsEscape(item.title)}`,
        item.notes ? `DESCRIPTION:${icsEscape(item.notes)}` : "",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(`Reminder: ${item.title}`)}`,
        "TRIGGER:-P1D",
        "END:VALARM",
        "END:VEVENT"
      );
    }
  }
  lines.push("END:VCALENDAR");
  return `${lines.filter(Boolean).map(foldLine).join("\r\n")}\r\n`;
};

export default function ExamsTracker() {
  const [language, setLanguage] = useLanguage();
  const [items, setItems] = useState<ExamItem[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const t = useTranslation(language);

  const persist = (next: ExamItem[]) => {
    setItems(next);
    safeSetItem(EXAMS_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(safeGetItem(EXAMS_KEY) || "[]");
      if (Array.isArray(saved)) setItems(saved);
    } catch {
      // Corrupt list: start clean.
    }
    setLoaded(true);
  }, []);

  const handleAdd = () => {
    if (!title.trim() || !date) return;
    persist([
      ...items,
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        date,
        time,
        notes: notes.trim(),
      },
    ]);
    setTitle("");
    setDate("");
    setTime("");
    setNotes("");
  };

  const handleExport = () => {
    const blob = new Blob([buildIcs(items)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bolibero-exams.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const sorted = [...items].sort((a, b) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
  );

  return (
    <PageLayout language={language} onLanguageChange={setLanguage}>
      <div className="container mx-auto max-w-3xl p-6">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.examsTitle}</h1>
          </div>
          <p className="max-w-3xl text-lg text-muted-foreground">
            {t.examsDescription}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t.addExam}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="exam-title"
                  className="text-xs font-medium text-muted-foreground"
                >
                  {t.examTitleLabel}
                </label>
                <Input
                  id="exam-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.examTitlePlaceholder}
                  className="h-11"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="exam-date"
                  className="text-xs font-medium text-muted-foreground"
                >
                  {t.examDateLabel}
                </label>
                <Input
                  id="exam-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="exam-time"
                  className="text-xs font-medium text-muted-foreground"
                >
                  {t.examTimeLabel}
                </label>
                <Input
                  id="exam-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="exam-notes"
                  className="text-xs font-medium text-muted-foreground"
                >
                  {t.examNotesLabel}
                </label>
                <Input
                  id="exam-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={handleAdd}
              disabled={!title.trim() || !date}
            >
              {t.addExam}
            </Button>
          </CardContent>
        </Card>

        {loaded && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t.examsTitle}</CardTitle>
                <CardDescription>{items.length}</CardDescription>
              </div>
              {items.length > 0 && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  {t.exportIcs}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {sorted.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t.emptyExams}
                </p>
              ) : (
                <div className="space-y-2">
                  {sorted.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-md bg-muted p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateFull(new Date(`${item.date}T00:00:00`), language)}
                          {item.time ? ` · ${item.time}` : ""}
                          {item.notes ? ` — ${item.notes}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => persist(items.filter((x) => x.id !== item.id))}
                        aria-label={t.removeExam}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
