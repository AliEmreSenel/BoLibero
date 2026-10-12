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
    navigation: "Main navigation",
    classCalendarNav: "Class Calendar",

    // Search
    search: "Search",
    searchPlaceholder: "Aula 1, Leoni, Velodromo…",
    timeRangeHint: "Shows rooms free for the whole time range — leave the times empty to see all.",
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
    openCalendarApp: "Add subscription calendar",
    copySubscriptionUrl: "Copy subscription URL",
    copied: "Copied",
    previewCalendarFeed: "Preview calendar feed",
    calendarCoverage:
      "The feed includes six months of history and up to one year of published future classes.",
    subscriptionHelp:
      "For Google Calendar, copy the URL and use Other calendars → From URL. Apple Calendar and Outlook can open it directly.",

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
    buildingClosedToday: "Questa aula è chiuso oggi",
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
    openCalendarApp: "Aggiungi calendario in abbonamento",
    copySubscriptionUrl: "Copia URL di iscrizione",
    copied: "Copiato",
    previewCalendarFeed: "Anteprima del calendario",
    calendarCoverage:
      "Il calendario include sei mesi di storico e fino a un anno di lezioni future già pubblicate.",
    subscriptionHelp:
      "Per Google Calendar, copia l'URL e usa Altri calendari → Da URL. Apple Calendar e Outlook possono aprirlo direttamente.",

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
