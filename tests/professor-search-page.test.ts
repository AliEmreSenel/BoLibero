import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Language } from "@/lib/i18n";

const state = vi.hoisted(() => ({
  query: "",
  pathname: "/professors",
  name: "D’Angelo José",
  language: "en" as Language,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.query ? { q: state.query } : {}),
  usePathname: () => state.pathname,
  useParams: () => ({ name: state.name }),
}));

vi.mock("@/lib/settings", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/settings")>(),
  useLanguage: () => [state.language, vi.fn()],
}));

import { ProfessorsIndex } from "@/app/professors/ProfessorsIndex";
import ProfessorsLoading from "@/app/professors/loading";
import ProfessorsError from "@/app/professors/error";
import ProfessorCalendar from "@/app/professor/[name]/ProfessorCalendar";
import { professorHref, professorsHref } from "@/lib/professor-search";

const professors = ["Bianchi Anna", "D’Angelo José", "Rossi M."];
const renderIndex = (names = professors) =>
  renderToStaticMarkup(createElement(ProfessorsIndex, { professors: names }));

beforeEach(() => {
  state.query = "";
  state.pathname = "/professors";
  state.language = "en";
});

describe("professor search page", () => {
  it("restores a shared query, filters the list and links to the exact published name", () => {
    state.query = "jose dangelo";
    const markup = renderIndex();

    expect(markup).toContain('value="jose dangelo"');
    expect(markup).toContain('href="' + professorHref("D’Angelo José", state.query) + '"');
    expect(markup).toContain("professor found");
    expect(markup).not.toContain("professors found");
    expect(markup).not.toContain(professorHref("Bianchi Anna", state.query));
    expect(markup).toContain('for="professor-search"');
    expect(markup).toContain('aria-controls="professor-results"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="Clear professor search"');
  });

  it("distinguishes an unmatched query from an empty published timetable", () => {
    state.query = "missing";
    const noMatch = renderIndex();
    expect(noMatch).toContain("No professors found");
    expect(noMatch).toContain("Try a shorter name");

    const empty = renderIndex([]);
    expect(empty).toContain("No professors in the published timetable yet");
    expect(empty).not.toContain("Try a shorter name");
  });

  it("renders the translated search, plural result count and timetable coverage", () => {
    state.language = "it";
    const markup = renderIndex();
    expect(markup).toContain("Cerca professori per nome");
    expect(markup).toContain("professori trovati");
    expect(markup).toContain("Vedi orario");
    expect(markup).toContain("91 giorni");
    expect(markup).toContain("I nomi sono riportati come pubblicati.");
  });

  it("shows an accessible loading state and a separate retryable error state", () => {
    const loading = renderToStaticMarkup(createElement(ProfessorsLoading));
    expect(loading).toContain("Loading professors…");
    expect(loading).toContain('aria-busy="true"');
    expect(loading).not.toContain("No professors found");

    const error = renderToStaticMarkup(createElement(ProfessorsError, {
      error: new Error("upstream unavailable"),
      reset: vi.fn(),
    }));
    expect(error).toContain('role="alert"');
    expect(error).toContain("Try again");
    expect(error).toContain("temporarily unavailable");
    expect(error).not.toContain("No professors found");
  });

  it("keeps the professor navigation active and restores the query from a calendar", () => {
    state.pathname = "/professor/D%E2%80%99Angelo%20Jos%C3%A9";
    state.query = "jose dangelo";
    const markup = renderToStaticMarkup(createElement(ProfessorCalendar));

    const professorNav = markup.match(/<a\b[^>]*>/g)
      ?.find((tag) => tag.includes('href="/professors"'));
    expect(professorNav).toContain('aria-current="page"');
    expect(markup).toContain('href="' + professorsHref(state.query) + '"');

    state.query = "";
    expect(renderToStaticMarkup(createElement(ProfessorCalendar)))
      .toContain('href="/professors"');
  });
});
