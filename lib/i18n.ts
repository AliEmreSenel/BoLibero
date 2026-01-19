export type Language = "en" | "it";

export const translations = {
  en: {
    // App
    appName: "BoLibero",
    appDescription: "Find available classrooms at Bocconi University.",

    // Navigation
    availableRooms: "Available Rooms",
    allCampuses: "ALL BUILDINGS",
    allRooms: "All Rooms",

    // Search
    searchPlaceholder: "Search room number or name...",
    startTime: "Start time",
    endTime: "End time",
    anyTime: "Any time",
    reset: "Reset",

    // Room info
    freeSlots: "free slots today",
    freeSlot: "free slot today",
    availableNow: "Available now",
    occupiedNow: "Occupied now",
    moreInfo: "More info",
    capacity: "Capacity",
    seats: "seats",

    // Time
    today: "Today",
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
    showOnlyStudyRooms: "Study rooms only",
    studyRoomsDescription: "Show only officially designated study rooms",

    // Status
    loading: "Loading university calendar...",
    error: "Error loading data. Please try again later.",
    noRooms: "No rooms found",
    noAvailableRooms: "No rooms available at the moment",

    // Building Hours
    buildingHours: "Building Hours",
    normalHours: "Normal hours",
    specialHours: "Special hours",
    holidayHours: "Holiday hours",
    closed: "Closed",
    open: "Open",
    buildingClosed: "Building is closed",
    buildingClosedToday: "This classroom is closed today",

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
    roomFreeAllDay: "The room is free all day",
    profNoClassToday: "This professor doesn't have class today",
    backToOverview: "Back to overview",
    refresh: "Refresh",
    updated: "Updated",

    // Detail pages - SEO friendly content
    roomScheduleFor: "Room Schedule for",
    professorScheduleFor: "Schedule for Professor",
    viewAvailability: "View real-time availability and scheduled events",
    checkBackLater: "Check back later for updated schedules",
    scheduleUpdatedRegularly: "Schedules are updated regularly from the university system",

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
    availableNow: "Disponibili Ora",

    // Search
    searchPlaceholder: "Cerca numero o nome aula...",
    startTime: "Ora inizio",
    endTime: "Ora fine",
    anyTime: "Qualsiasi ora",
    reset: "Reset",

    // Room info
    freeSlots: "slot liberi oggi",
    freeSlot: "slot libero oggi",
    occupiedNow: "Occupata ora",
    moreInfo: "Maggiori info",
    capacity: "Capienza",
    seats: "posti",

    // Time
    today: "Oggi",
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
    showOnlyStudyRooms: "Solo aule studio",
    studyRoomsDescription: "Mostra solo aule studio ufficialmente designate",

    // Status
    loading: "Caricamento calendario università...",
    error: "Errore nel caricamento dei dati. Riprova più tardi.",
    noRooms: "Nessuna aula trovata",
    noAvailableRooms: "Nessuna aula disponibile al momento",

    // Building Hours
    buildingHours: "Orari Edificio",
    normalHours: "Orari normali",
    specialHours: "Orari speciali",
    holidayHours: "Orari festivi",
    closed: "Chiuso",
    open: "Aperto",
    buildingClosed: "Edificio chiuso",
    buildingClosedToday: "Questa aula è chiuso oggi",

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
    roomFreeAllDay: "L'aula è libera tutto il giorno",
    profNoClassToday: "Questo professore non ha lezione oggi",
    backToOverview: "Torna alla vista generale",
    refresh: "Aggiorna",
    updated: "Aggiornato",

    // Detail pages - SEO friendly content
    roomScheduleFor: "Orario dell'aula",
    professorScheduleFor: "Orario del Professore",
    viewAvailability: "Visualizza disponibilità in tempo reale ed eventi programmati",
    checkBackLater: "Controlla più tardi per orari aggiornati",
    scheduleUpdatedRegularly: "Gli orari sono aggiornati regolarmente dal sistema universitario",

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

export function useTranslation(language: Language) {
  return translations[language];
}

export type Translations = ReturnType<typeof useTranslation>;
