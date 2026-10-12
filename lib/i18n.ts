export type Language = "en" | "it";

import { format } from "date-fns";
import { it as itLocale, enUS } from "date-fns/locale";

export const translations = {
  en: {
    // App
    appName: "BoLibero",
    appDescription: "Find available classrooms at Bocconi University.",

    // Navigation
    availableRooms: "Available Rooms",
    allCampuses: "ALL BUILDINGS",
    allRooms: "All Rooms",
    navigation: "Main navigation",
    classCalendarNav: "Class Calendar",

    // Search
    search: "Search",
    searchPlaceholder: "Aula 1, Leoni, Velodromo…",
    timeRangeHint: "Shows rooms free for the whole time range — leave the times empty to see all.",
    freeSlotsToday: "Free slots today",
    studySessionsToday: "Study sessions today",
    closedOpensAt: "Closed · opens",
    startTime: "Start time",
    endTime: "End time",
    anyTime: "Any time",
    reset: "Reset",

    // Room info
    freeSlots: "free slots today",
    freeSlot: "free slot today",
    availableNow: "Available now",
    availableAtSelectedTime: "Available at selected time",
    availableAtThisTime: "Available at this time",
    occupiedNow: "Occupied now",
    occupiedAtThisTime: "Occupied at this time",
    moreInfo: "More info",
    capacity: "Capacity",
    seats: "seats",

    // Time
    today: "Today",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    day: "Day",
    roomsFound: "rooms found",
    roomFound: "room found",

    // Settings
    settings: "Settings",
    theme: "Theme",
    language: "Language",
    dark: "Dark",
    light: "Light",
    english: "English",
    italian: "Italian",
    system: "System",
    showOnlyStudyRooms: "Study rooms only",
    studyRoomsDescription: "Show only officially designated study rooms",

    // Status
    loading: "Loading university calendar...",
    error: "Error loading data. Please try again later.",
    noRooms: "No rooms found",
    noAvailableRooms: "No rooms available at the moment",
    noRoomsAvailableAtThisTime: "No rooms available at this time",
    futureDatesNotice: "Schedules for future dates may vary.",
    noDataForDate: "No schedule data received for this date. The grid is hidden so it can't be mistaken for availability.",
    notFoundTitle: "Page not found",
    notFoundDescription: "The page you are looking for doesn't exist. The room may have been renamed or removed.",
    backToRooms: "Back to rooms",

    // Building Hours
    buildingHours: "Building Hours",
    normalHours: "Normal hours",
    specialHours: "Special hours",
    holidayHours: "Holiday hours",
    closed: "Closed",
    open: "Open",
    buildingClosed: "Building is closed",
    allBuildingsClosed: "All buildings are closed on the selected date.",
    buildingClosedToday: "This classroom is closed today",
    buildingClosedOnSelectedDate: "This classroom is closed on the selected date",

    // Buildings
    buildings: {
      "Sarfatti 25": "Via Sarfatti 25",
      "Sraffa 13": "Via Sraffa 13",
      Roentgen: "Via Roentgen",
    },

    // Calendar
    calendar: "Calendar",
    selectDateToView: "Select a date to view events",
    eventsFor: "Events for",
    loadingEvents: "Loading events...",
    noEventsScheduled: "No events scheduled for this date",
    eventScheduled: "event scheduled",
    eventsScheduled: "events scheduled",
    eventThisMonth: "event this month",
    eventsThisMonth: "events this month",
    roomFreeAllDay: "No classes published for this day",
    profNoClassToday: "No classes published for this professor on this day",
    backToOverview: "Back to overview",
    refresh: "Refresh",
    updated: "Updated",

    // Detail pages - SEO friendly content
    roomScheduleFor: "Room Schedule for",
    professorScheduleFor: "Schedule for Professor",
    viewAvailability: "View real-time availability and scheduled events",
    checkBackLater: "Check back later for updated schedules",
    scheduleUpdatedRegularly: "Schedules are updated regularly from the university system",

    // Class subscription calendar
    classCalendarTitle: "Build your class calendar",
    classCalendarDescription:
      "Choose your classes once and subscribe to an automatically updated calendar. No account required.",
    chooseClasses: "Choose classes",
    chooseClassesDescription:
      "Search by course name, code, or class number and add up to 20 classes.",
    classSearchPlaceholder: "Search classes, e.g. 20127 or Corporate Finance...",
    loadingClasses: "Loading classes...",
    noClassesFound: "No matching classes found",
    classCatalogError: "The class catalog could not be loaded. Please try again later.",
    yourBundle: "Your bundle",
    yourBundleDescription: "These classes will appear in one calendar.",
    emptyBundle: "Select classes from the list to start your bundle.",
    removeClass: "Remove class",
    subscribeCalendar: "Subscribe",
    subscribeDescription:
      "Your calendar app will keep this schedule in sync automatically.",
    openCalendarApp: "Subscribe in calendar app",
    copySubscriptionUrl: "Copy subscription URL",
    copied: "Copied",
    previewCalendarFeed: "View raw .ics file",
    calendarCoverage:
      "The feed covers the current catalog window: classes from six months ago up to one year ahead.",
    subscriptionHelp:
      "For Google Calendar, copy the URL and use Other calendars → From URL. Apple Calendar and Outlook can open it directly.",
    capReached:
      "You've added the maximum of {max} classes. Remove one to add another.",
    first100Note:
      "Showing the first 100 matches — keep typing to narrow the list.",
    webcalClicked:
      "Your calendar app should open with a subscription prompt.",
    resubscribeHint:
      "Changed your classes? Copy the URL and subscribe again — most apps keep the old bundle until you re-subscribe.",
    classNo: "Class no.",
    shareClassList: "Copy class-list link",
    shareClassListHelp:
      "Share this link with classmates: it opens the calendar builder with your bundle pre-selected.",
    mySchedule: "My Schedule",
    myScheduleTitle: "My Schedule",
    myScheduleDescription:
      "Your next 7 days, built from the classes you selected in the class calendar.",
    myScheduleEmpty:
      "You haven't added any classes yet. Pick them in the class calendar and they will show up here.",
    openClassCalendar: "Open class calendar",
    noEventsNextDays: "No classes in the next 7 days.",
    loadEventsError: "Some class schedules could not be loaded. Try again later.",
    favorites: "Favorites",
    free2h: "Free ≥ 2h",
    addFavorite: "Add to favorites",
    removeFavorite: "Remove from favorites",
    roomChangeBanner: "Rooms changed for your classes since your last visit:",
    examsTitle: "Exams & Deadlines",
    examsDescription:
      "Track your exams and assignment deadlines on your device and export them to your calendar with a reminder one day before.",
    examTitleLabel: "Title",
    examTitlePlaceholder: "e.g. Statistics exam",
    examDateLabel: "Date",
    examTimeLabel: "Time (optional)",
    examNotesLabel: "Notes (optional)",
    addExam: "Add",
    removeExam: "Remove",
    exportIcs: "Export .ics to calendar",
    emptyExams: "No exams or deadlines yet. Add your first one above.",
    examsNav: "Exams",
    dataSourceLine: "Data: didattica.unibocconi.it · updated",
    contact: "Contact",
    privacy: "Privacy",

    // Privacy policy
    privacyTitle: "Privacy Policy",
    privacyUpdated: "Last updated: October 2026",
    privacyIntro:
      "BoLibero is an unofficial, open-source tool for Bocconi students. It collects as little data as possible: there are no accounts, no tracking cookies and no ads.",
    privacyScrapedTitle: "Scraped schedule data",
    privacyScraped:
      "We read the public Bocconi University timetable (didattica.unibocconi.it) to show room availability and class schedules. The data belongs to the university and can change at any time; no personal data of students, professors or staff is stored by us.",
    privacyLocalStorageTitle: "Your device (localStorage)",
    privacyLocalStorage:
      "Your language, theme, room filters and calendar class bundle are stored in your browser's localStorage. They never leave your device and are deleted when you clear your browser data.",
    privacySentryTitle: "Error telemetry (Sentry)",
    privacySentry:
      "When the app hits a runtime error, technical details (error message, stack trace, browser and page URL) are sent to Sentry so we can fix bugs. No names, classes, cookies or browsing history are sent.",
    privacyContactTitle: "Contact",
    privacyContact:
      "Questions, data removal requests and bug reports: open an issue on our GitHub repository.",

    // Footer
    disclaimer:
      "This application is not affiliated with or endorsed by Bocconi University. It is an independent project created for educational purposes.",
    author: "Created by",
    githubLink: "View on GitHub",
  },
  it: {
    // App
    appName: "BoLibero",
    appDescription: "Trova aule disponibili all'Università Bocconi.",

    // Navigation
    availableRooms: "Aule Disponibili",
    allCampuses: "TUTTI I EDIFICI",
    allRooms: "Tutte le Aule",
    navigation: "Navigazione principale",
    classCalendarNav: "Calendario Lezioni",
    availableNow: "Disponibili Ora",
    availableAtSelectedTime: "Disponibili all'orario selezionato",
    availableAtThisTime: "Disponibili a quest'ora",

    // Search
    search: "Cerca",
    searchPlaceholder: "Aula 1, Leoni, Velodromo…",
    timeRangeHint: "Mostra le aule libere per tutta la fascia oraria — lascia gli orari vuoti per vederle tutte.",
    freeSlotsToday: "Fasce libere oggi",
    studySessionsToday: "Sessioni studio oggi",
    closedOpensAt: "Chiuso · apre alle",
    startTime: "Ora inizio",
    endTime: "Ora fine",
    anyTime: "Qualsiasi ora",
    reset: "Reset",

    // Room info
    freeSlots: "slot liberi oggi",
    freeSlot: "slot libero oggi",
    occupiedNow: "Occupata ora",
    occupiedAtThisTime: "Occupata a quest'ora",
    moreInfo: "Maggiori info",
    capacity: "Capienza",
    seats: "posti",

    // Time
    today: "Oggi",
    prevMonth: "Mese precedente",
    nextMonth: "Mese successivo",
    day: "Giorno",
    roomsFound: "aule trovate",
    roomFound: "aula trovata",

    // Settings
    settings: "Impostazioni",
    theme: "Tema",
    language: "Lingua",
    dark: "Scuro",
    light: "Chiaro",
    english: "Inglese",
    italian: "Italiano",
    system: "Sistema",
    showOnlyStudyRooms: "Solo aule studio",
    studyRoomsDescription: "Mostra solo aule studio ufficialmente designate",

    // Status
    loading: "Caricamento calendario università...",
    error: "Errore nel caricamento dei dati. Riprova più tardi.",
    noRooms: "Nessuna aula trovata",
    noAvailableRooms: "Nessuna aula disponibile al momento",
    noRoomsAvailableAtThisTime: "Nessuna aula disponibile a quest'ora",
    futureDatesNotice: "Gli orari delle date future possono variare.",
    noDataForDate: "Nessun dato di orario ricevuto per questa data. La griglia è nascosta per non essere scambiata per disponibilità.",
    notFoundTitle: "Pagina non trovata",
    notFoundDescription: "La pagina che cerchi non esiste. L'aula potrebbe essere stata rinominata o rimossa.",
    backToRooms: "Torna alle aule",

    // Building Hours
    buildingHours: "Orari Edificio",
    normalHours: "Orari normali",
    specialHours: "Orari speciali",
    holidayHours: "Orari festivi",
    closed: "Chiuso",
    open: "Aperto",
    buildingClosed: "Edificio chiuso",
    allBuildingsClosed: "Tutti gli edifici sono chiusi nella data selezionata.",
    buildingClosedToday: "Questa aula è chiusa oggi",
    buildingClosedOnSelectedDate: "Questa aula è chiusa nella data selezionata",

    // Buildings
    buildings: {
      "Sarfatti 25": "Via Sarfatti 25",
      "Sraffa 13": "Via Sraffa 13",
      Roentgen: "Via Roentgen",
    },

    // Calendar
    calendar: "Calendario",
    selectDateToView: "Seleziona una data per visualizzare gli eventi",
    eventsFor: "Eventi per",
    loadingEvents: "Caricamento eventi...",
    noEventsScheduled: "Nessun evento programmato per questa data",
    eventScheduled: "evento programmato",
    eventsScheduled: "eventi programmati",
    eventThisMonth: "evento questo mese",
    eventsThisMonth: "eventi questo mese",
    roomFreeAllDay: "Nessun orario pubblicato per questo giorno",
    profNoClassToday: "Nessuna lezione pubblicata per questo professore in questo giorno",
    backToOverview: "Torna alla vista generale",
    refresh: "Aggiorna",
    updated: "Aggiornato",

    // Detail pages - SEO friendly content
    roomScheduleFor: "Orario dell'aula",
    professorScheduleFor: "Orario del Professore",
    viewAvailability: "Visualizza disponibilità in tempo reale ed eventi programmati",
    checkBackLater: "Controlla più tardi per orari aggiornati",
    scheduleUpdatedRegularly: "Gli orari sono aggiornati regolarmente dal sistema universitario",

    // Class subscription calendar
    classCalendarTitle: "Crea il tuo calendario delle lezioni",
    classCalendarDescription:
      "Scegli le tue lezioni e iscriviti a un calendario aggiornato automaticamente. Non serve un account.",
    chooseClasses: "Scegli le lezioni",
    chooseClassesDescription:
      "Cerca per nome, codice o numero di classe e aggiungi fino a 20 lezioni.",
    classSearchPlaceholder: "Cerca lezioni, es. 20127 o Corporate Finance...",
    loadingClasses: "Caricamento lezioni...",
    noClassesFound: "Nessuna lezione corrispondente",
    classCatalogError: "Impossibile caricare l'elenco delle lezioni. Riprova più tardi.",
    yourBundle: "Il tuo gruppo",
    yourBundleDescription: "Queste lezioni appariranno in un unico calendario.",
    emptyBundle: "Seleziona le lezioni dall'elenco per iniziare.",
    removeClass: "Rimuovi lezione",
    subscribeCalendar: "Iscriviti",
    subscribeDescription:
      "L'app calendario manterrà automaticamente sincronizzato questo orario.",
    openCalendarApp: "Iscrivi nel calendario",
    copySubscriptionUrl: "Copia URL di iscrizione",
    copied: "Copiato",
    previewCalendarFeed: "Mostra file .ics grezzo",
    calendarCoverage:
      "Il feed copre la finestra del catalogo attuale: lezioni da sei mesi fa fino a un anno avanti.",
    subscriptionHelp:
      "Per Google Calendar, copia l'URL e usa Altri calendari → Da URL. Apple Calendar e Outlook possono aprirlo direttamente.",
    capReached:
      "Hai aggiunto il massimo di {max} lezioni. Rimuovine una per aggiungerne un'altra.",
    first100Note:
      "Mostrate i primi 100 risultati — continua a scrivere per restringere l'elenco.",
    webcalClicked:
      "L'app calendario dovrebbe aprirsi con una richiesta di iscrizione.",
    resubscribeHint:
      "Hai cambiato le tue lezioni? Copia di nuovo l'URL e iscriviti di nuovo — la maggior parte delle app mantiene il vecchio gruppo finché non ti riscrivi.",
    classNo: "Cl. n.",
    shareClassList: "Copia link elenco lezioni",
    shareClassListHelp:
      "Condividi questo link con i compagni: apre il costruttore di calendario con il tuo gruppo già selezionato.",
    mySchedule: "Il mio orario",
    myScheduleTitle: "Il mio orario",
    myScheduleDescription:
      "I prossimi 7 giorni, costruiti dalle lezioni selezionate nel calendario lezioni.",
    myScheduleEmpty:
      "Non hai ancora aggiunto lezioni. Sceglile nel calendario lezioni e appariranno qui.",
    openClassCalendar: "Apri calendario lezioni",
    noEventsNextDays: "Nessuna lezione nei prossimi 7 giorni.",
    loadEventsError:
      "Alcuni orari delle lezioni non sono stati caricati. Riprova più tardi.",
    favorites: "Preferite",
    free2h: "Libera ≥ 2h",
    addFavorite: "Aggiungi ai preferiti",
    removeFavorite: "Rimuovi dai preferiti",
    roomChangeBanner: "Aule cambiate per le tue lezioni dall'ultima visita:",
    examsTitle: "Esami e scadenze",
    examsDescription:
      "Tieni traccia dei tuoi esami e scadenze sul tuo dispositivo ed esportali nel calendario con un promemoria un giorno prima.",
    examTitleLabel: "Titolo",
    examTitlePlaceholder: "es. Esame di Statistica",
    examDateLabel: "Data",
    examTimeLabel: "Ora (facoltativa)",
    examNotesLabel: "Note (facoltative)",
    addExam: "Aggiungi",
    removeExam: "Rimuovi",
    exportIcs: "Esporta .ics nel calendario",
    emptyExams: "Ancora nessun esame o scadenza. Aggiungi il primo qui sopra.",
    examsNav: "Esami",
    dataSourceLine: "Dati: didattica.unibocconi.it · aggiornati alle",
    contact: "Contatti",
    privacy: "Privacy",

    // Privacy policy
    privacyTitle: "Informativa sulla privacy",
    privacyUpdated: "Ultimo aggiornamento: ottobre 2026",
    privacyIntro:
      "BoLibero è uno strumento non ufficiale e open-source per gli studenti Bocconi. Raccoglie il minimo possibile: niente account, niente cookie di tracciamento, niente pubblicità.",
    privacyScrapedTitle: "Dati orari raccolti",
    privacyScraped:
      "Leggiamo l'orario pubblico dell'Università Bocconi (didattica.unibocconi.it) per mostrare la disponibilità delle aule e gli orari delle lezioni. I dati appartengono all'università e possono cambiare in qualsiasi momento; non archiviamo dati personali di studenti, professori o personale.",
    privacyLocalStorageTitle: "Il tuo dispositivo (localStorage)",
    privacyLocalStorage:
      "Lingua, tema, filtri sulle aule e il gruppo di lezioni del calendario sono salvati nel localStorage del tuo browser. Non lasciano mai il dispositivo e si cancellano svuotando i dati del browser.",
    privacySentryTitle: "Telemetria degli errori (Sentry)",
    privacySentry:
      "Quando l'app incontra un errore, i dettagli tecnici (messaggio, stack trace, browser e URL della pagina) vengono inviati a Sentry per correggere i bug. Non vengono inviati nomi, corsi, cookie o cronologia di navigazione.",
    privacyContactTitle: "Contatti",
    privacyContact:
      "Domande, richieste di cancellazione dati e segnalazioni: apri una issue sul nostro repository GitHub.",

    // Footer
    disclaimer:
      "Questa applicazione non è affiliata o approvata dall'Università Bocconi. È un progetto indipendente creato per scopi educativi.",
    author: "Creato da",
    githubLink: "Visualizza su GitHub",
  },
};

export function getSystemLanguage(): Language {
    if (typeof window === "undefined") return "en";

    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("it")) return "it";
    return "en";
}

export function formatDateFull(date: Date, language: Language): string {
  return format(date, "EEEE, d MMMM yyyy", {
    locale: language === "it" ? itLocale : enUS,
  });
}

const EVENT_TYPE_LABELS: Record<Language, Record<string, string>> = {
  en: {
    lezione: "Lesson",
    esame: "Exam",
    seminario: "Seminar",
    studio: "Study room",
    "aula studio": "Study room",
    "aule studio": "Study rooms",
  },
  it: {
    lezione: "Lezione",
    esame: "Esame",
    seminario: "Seminario",
    studio: "Aula studio",
    "aula studio": "Aula studio",
    "aule studio": "Aule studio",
  },
};

export function getEventTypeLabel(type: string, language: Language): string {
  const key = type.trim().toLowerCase();
  return EVENT_TYPE_LABELS[language][key] ?? type;
}

export function useTranslation(language: Language) {
  return translations[language];
}

export type Translations = ReturnType<typeof useTranslation>;
