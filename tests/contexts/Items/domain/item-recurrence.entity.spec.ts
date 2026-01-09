import { DateValueObject } from "@juandardilag/value-objects";
import { describe, expect, it } from "vitest";
import { buildTestItems } from "./buildTestItems";

describe("totalRecurrences", () => {
	it("should return minus one for a recurrence with infinite schedule", () => {
		const items = buildTestItems([{ recurrence: { frequency: "2d" } }]);
		const item = items[0].copy();
		const recurrences = item.recurrencePattern.totalOccurrences;

		expect(recurrences).toBe(-1);
	});

	it("should return the 1 recurrence for a single time item", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: DateValueObject.createNowDate(),
					untilDate: DateValueObject.createNowDate(),
				},
			},
		]);
		const item = items[0].copy();
		const recurrences = item.recurrencePattern.totalOccurrences;

		expect(recurrences).toBe(1);
	});

	it("should return the total recurrences for a scheduled item with until date", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: DateValueObject.createNowDate(),
					untilDate: new DateValueObject(
						new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
					),
				},
			},
		]);
		const item = items[0].copy();
		const recurrences = item.recurrencePattern.totalOccurrences;

		expect(recurrences).toBe(8);
	});
});
