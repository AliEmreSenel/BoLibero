import { describe, expect, it } from "vitest";
import { htmlToText } from "@/lib/bocconi-calendar";

describe("htmlToText", () => {
  it("neutralizes entity-encoded script markup", () => {
    expect(
      htmlToText("&lt;script&gt;alert(1)&lt;/script&gt;Ciao")
    ).toBe("Ciao");
  });

  it("neutralizes entity-encoded tags", () => {
    expect(htmlToText("&lt;img src=x onerror=alert(1)&gt;Hi")).toBe("Hi");
  });

  it("strips live script and style content", () => {
    expect(
      htmlToText("<script>alert(1)</script><style>p{}</style>Lab")
    ).toBe("Lab");
  });

  it("converts br to newlines when preserving breaks", () => {
    expect(htmlToText("MATH<br/>MODULE 1", true)).toBe("MATH\nMODULE 1");
  });

  it("converts br to spaces by default", () => {
    expect(htmlToText("MATH<br/>MODULE 1")).toBe("MATH MODULE 1");
  });
});
