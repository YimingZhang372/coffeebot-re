/** The impact translator: one formula, 15 g of wet grounds per coffee, used under every gram figure. */

export const COFFEE_G = 15;

export const coffees = (grams) => Math.round((grams || 0) / COFFEE_G);

/** Working days of a floor's whole coffee intake: grams ÷ (headcount × 15 g). */
export const floorDays = (grams, eligible) =>
  Math.round((grams || 0) / Math.max(1, (eligible || 1) * COFFEE_G));

export const personalLine = (grams) => `= ${coffees(grams)} of your coffees`;
export const floorLine = (grams, eligible) => `= ${floorDays(grams, eligible)} working days of your floor's coffee`;
export const officeLine = (grams) => `= ${coffees(grams)} coffees`;

export const FORMULA = {
  personal: "grams ÷ 15 g per coffee, rounded",
  floor: "grams ÷ (floor headcount × 15 g per coffee), rounded",
  office: "grams ÷ 15 g per coffee, rounded",
};

export function impactLine(grams, scope = "office", eligible = 150) {
  if (scope === "personal") return personalLine(grams);
  if (scope === "floor") return floorLine(grams, eligible);
  return officeLine(grams);
}