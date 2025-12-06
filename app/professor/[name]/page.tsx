"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Clock,
    MapPin,
    User,
    BookOpen,
    RefreshCw,
} from "lucide-react";
import {
    format,
    parseISO,
    isSameDay,
    startOfMonth,
    endOfMonth,
    addMonths,
    subMonths,
} from "date-fns";
import { it, enUS } from "date-fns/locale";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ScheduleFetcher } from "@/lib/schedule-fetcher";
import type { ScheduleEvent } from "@/lib/schedule-fetcher";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { type Language, useTranslation } from "@/lib/i18n";
import { loadSettings, saveSettings } from "@/lib/settings";

export default function RoomCalendar() {
    const params = useParams();
    const name = decodeURIComponent(params.name as string);

    const [roomEvents, setRoomEvents] = useState<ScheduleEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [language, setLanguage] = useState<Language>("en");

    const fetcher = ScheduleFetcher.getInstance();
    const t = useTranslation(language);

    // Load settings on mount
    useEffect(() => {
        const loadedSettings = loadSettings();
        setLanguage(loadedSettings.language);
    }, []);

    const loadMonthSchedule = async (month: Date) => {
        setLoading(true);
        setError(null);
        try {
            const startDate = startOfMonth(month);
            const endDate = endOfMonth(month);

            const events = await fetcher.fetchProfSchedule(name, startDate, endDate);
            setRoomEvents(events);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error loading room schedule:", error);
            setError(t.error);
            setRoomEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMonthSchedule(currentMonth);
    }, [currentMonth, name]);

    const getEventsForDate = (date: Date) => {
        return roomEvents
            .filter((event) => {
                const eventDate = parseISO(event.date);
                return isSameDay(eventDate, date);
            })
            .sort((a, b) => a.start.localeCompare(b.start));
    };

    const getDatesWithEvents = () => {
        return roomEvents.map((event) => parseISO(event.date));
    };

    const handleMonthChange = (direction: "prev" | "next") => {
        const newMonth =
            direction === "next"
                ? addMonths(currentMonth, 1)
                : subMonths(currentMonth, 1);
        setCurrentMonth(newMonth);
    };

    const handleRefresh = () => {
        fetcher.clearCache();
        loadMonthSchedule(currentMonth);
    };

    const handleLanguageChange = (newLanguage: Language) => {
        setLanguage(newLanguage);
        const currentSettings = loadSettings();
        saveSettings({ ...currentSettings, language: newLanguage });
    };

    const eventsForSelectedDate = getEventsForDate(selectedDate);
    const datesWithEvents = getDatesWithEvents();

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <Navbar language={language} onLanguageChange={handleLanguageChange} />

            <main className="flex-1">
                <div className="container mx-auto p-6 max-w-7xl">
                    {/* Back Button */}
                    <div className="mb-6 flex items-center justify-between">
                        <Link href="/">
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {language === "it"
                                    ? "Torna alla vista generale"
                                    : "Back to overview"}
                            </Button>
                        </Link>
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                        >
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                            />
                            {language === "it" ? "Aggiorna" : "Refresh"}
                        </Button>
                    </div>

                    {/* Page Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold mb-2">{name}</h1>
                        <div className="mt-2 flex items-center justify-center gap-4">
                            <Badge variant="outline" className="text-sm">
                                {roomEvents.length}{" "}
                                {language === "it"
                                    ? roomEvents.length === 1
                                        ? "evento questo mese"
                                        : "eventi questo mese"
                                    : roomEvents.length === 1
                                        ? "event this month"
                                        : "events this month"}
                            </Badge>
                            {lastUpdated && (
                                <div className="text-sm text-muted-foreground">
                                    {language === "it" ? "Aggiornato" : "Updated"}:{" "}
                                    {format(lastUpdated, "HH:mm", {
                                        locale: language === "it" ? it : enUS,
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{language === "it" ? "Calendario" : "Calendar"}</span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMonthChange("prev")}
                                                disabled={loading}
                                            >
                                                ←
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMonthChange("next")}
                                                disabled={loading}
                                            >
                                                →
                                            </Button>
                                        </div>
                                    </CardTitle>
                                    <CardDescription>
                                        {format(currentMonth, "MMMM yyyy", {
                                            locale: language === "it" ? it : enUS,
                                        })}
                                        <br />
                                        {language === "it"
                                            ? "Seleziona una data per visualizzare gli eventi"
                                            : "Select a date to view events"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-center">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && setSelectedDate(date)}
                                        month={currentMonth}
                                        onMonthChange={(month) => {
                                            setCurrentMonth(month);
                                        }}
                                        modifiers={{
                                            hasEvents: datesWithEvents,
                                        }}
                                        modifiersStyles={{
                                            hasEvents: {
                                                backgroundColor: "hsl(var(--primary))",
                                                color: "hsl(var(--primary-foreground))",
                                                fontWeight: "bold",
                                            },
                                        }}
                                        locale={language === "it" ? it : enUS}
                                        className="rounded-md border w-fit"
                                        disabled={loading}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Events for selected date */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {language === "it" ? "Eventi per" : "Events for"}{" "}
                                        {format(selectedDate, "EEEE, d MMMM yyyy", {
                                            locale: language === "it" ? it : enUS,
                                        })}
                                    </CardTitle>
                                    <CardDescription>
                                        {loading
                                            ? language === "it"
                                                ? "Caricamento eventi..."
                                                : "Loading events..."
                                            : eventsForSelectedDate.length === 0
                                                ? language === "it"
                                                    ? "Nessun evento programmato per questa data"
                                                    : "No events scheduled for this date"
                                                : `${eventsForSelectedDate.length} ${language === "it"
                                                    ? eventsForSelectedDate.length === 1
                                                        ? "evento programmato"
                                                        : "eventi programmati"
                                                    : eventsForSelectedDate.length === 1
                                                        ? "event scheduled"
                                                        : "events scheduled"
                                                }`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {loading ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                                <p className="mt-2 text-muted-foreground">
                                                    {language === "it"
                                                        ? "Caricamento eventi..."
                                                        : "Loading events..."}
                                                </p>
                                            </div>
                                        ) : eventsForSelectedDate.length > 0 ? (
                                            eventsForSelectedDate.map((event, index) => (
                                                <Card
                                                    key={index}
                                                    className="border-l-4 border-l-primary"
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">{event.type}</Badge>
                                                                {event.code && (
                                                                    <Badge variant="secondary">
                                                                        {event.code}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                <Clock className="h-4 w-4" />
                                                                {event.start} - {event.end}
                                                            </div>
                                                        </div>

                                                        {event.class && (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">
                                                                    {event.class}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {event.description && (
                                                            <div
                                                                className="text-sm text-muted-foreground mb-3"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: event.description.replace(
                                                                        /<br\/?>/g,
                                                                        "",
                                                                    ),
                                                                }}
                                                            />
                                                        )}

                                                        <div className="flex flex-col gap-2 text-sm">
                                                            {event.teachers && (
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                    {event.teachers.map((t, i) => (
                                                                        <Link key={t} href={"/professor/" + t}>
                                                                            <Badge>{t}</Badge>
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                                {event.rooms.map((r) => (
                                                                    <Link
                                                                        key={r.roomName}
                                                                        href={
                                                                            "/room/" + r.building + "/" + r.roomName
                                                                        }
                                                                    >
                                                                        <span>
                                                                            {r.roomName +
                                                                                ", " +
                                                                                fetcher.getBuildingDisplayName(
                                                                                    r.building,
                                                                                )}
                                                                        </span>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground">
                                                    📅
                                                </div>
                                                <p className="text-muted-foreground">
                                                    {language === "it"
                                                        ? "Nessun evento programmato per questa data"
                                                        : "No events scheduled for this date"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {language === "it"
                                                        ? "Questo professore non ha lezione oggi"
                                                        : "This professor doesn't have class today"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer language={language} />
        </div>
    );
}
