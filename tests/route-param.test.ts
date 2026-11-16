import { describe, expect, it } from "vitest";
import { decodeRouteParam } from "@/lib/utils";

describe("decodeRouteParam", () => {
  it("decodes once- and twice-encoded segments", () => {
    expect(decodeRouteParam("Aula%2012")).toBe("Aula 12");
    expect(decodeRouteParam("Aula%252012")).toBe("Aula 12");
    expect(decodeRouteParam("Sarfatti%2025")).toBe("Sarfatti 25");
  });

  it("leaves plain and malformed values alone", () => {
    expect(decodeRouteParam("Aula 12")).toBe("Aula 12");
    expect(decodeRouteParam("ROSSI%")).toBe("ROSSI%");
    expect(decodeRouteParam("CARNEVALE MAFFE' C.")).toBe("CARNEVALE MAFFE' C.");
  });
});
