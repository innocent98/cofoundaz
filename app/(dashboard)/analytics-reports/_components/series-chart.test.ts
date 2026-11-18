import { describe, expect, it } from "vitest";
import { axisIds, compactTick } from "./series-chart";

const money = { unit: "money", currency: "NGN" } as const;
const count = { unit: "count", currency: null } as const;

describe("axisIds", () => {
  it("puts two same-unit series on one axis, so Revenue and Expenses compare honestly (re-walk A1)", () => {
    expect(axisIds([money, money])).toEqual([0, 0]);
  });

  it("gives a second, different unit its own axis", () => {
    expect(axisIds([money, count])).toEqual([0, 1]);
  });

  it("keeps a single series on the left axis", () => {
    expect(axisIds([count])).toEqual([0]);
  });
});

describe("compactTick", () => {
  it("never collapses neighbouring money ticks to the same label (re-walk A2: ₦1k, ₦1k)", () => {
    // Recharts' ticks for a ₦1,234 max: 0, 350, 700, 1,050, 1,400 (in kobo below).
    const ticks = [0, 35_000, 70_000, 105_000, 140_000].map((v) => compactTick(v, money));
    expect(ticks).toEqual(["₦0", "₦350", "₦700", "₦1.1k", "₦1.4k"]);
    expect(new Set(ticks).size).toBe(ticks.length);
  });

  it("drops the decimal from ten of a unit up, and scales to M and B", () => {
    expect(compactTick(800_000, money)).toBe("₦8k");
    expect(compactTick(1_250_000, money)).toBe("₦13k");
    expect(compactTick(150_000_000, money)).toBe("₦1.5M");
    expect(compactTick(250_000_000_000, money)).toBe("₦2.5B");
  });

  it("shortens large counts the same way", () => {
    expect(compactTick(98_765, count)).toBe("99k");
    expect(compactTick(4_321, count)).toBe("4.3k");
  });
});
