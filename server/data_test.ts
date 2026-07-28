import { assertEquals } from "@std/assert";
import { CONTENT } from "./data.ts";

Deno.test("soundtrack is a single ordered list (no A/B sides)", () => {
  assertEquals(Array.isArray(CONTENT.tracks), true);
  assertEquals(CONTENT.tracks.length, 10);
  assertEquals(CONTENT.tracks[0].n, "01");
  assertEquals(CONTENT.tracks.at(-1)?.n, "10");
});

Deno.test("all soundtrack artists come from the band's stated set list", () => {
  const setList = new Set([
    "Goo Goo Dolls",
    "The Cranberries",
    "Gin Blossoms",
    "Oasis",
    "Third Eye Blind",
    "Stone Temple Pilots",
    "Hootie & the Blowfish",
    "Matchbox Twenty",
    "No Doubt",
    "Radiohead",
    "Green Day",
    "Sixpence None the Richer",
    "Deep Blue Something",
    "4 Non Blondes",
    "Alanis Morissette",
    "Sheryl Crow",
    "Aerosmith",
    "The Cure",
    "Smash Mouth",
    "Sugar Ray",
    "Barenaked Ladies",
  ]);
  for (const t of CONTENT.tracks) {
    assertEquals(setList.has(t.a), true, `${t.a} not in the band's set list`);
  }
});

Deno.test("tour lists remain intact (hidden later, Day 2)", () => {
  assertEquals(CONTENT.tour.upcoming.length, 5);
  assertEquals(CONTENT.tour.past.length, 4);
});
