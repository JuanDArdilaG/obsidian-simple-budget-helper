import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { ItemRecurrenceFrequency } from "contexts/Items/domain/item-recurrence-frequency.valueobject";
import { ItemRecurrence } from "contexts/Items/domain/item-recurrence.entity";
import { describe, expect, it } from "vitest";
import { buildTestItems } from "./buildTestItems";

describe("totalRecurrences", () => {
	it("should return minus one for a recurrence with infinite schedule", () => {
		const items = buildTestItems([{ recurrence: { frequency: "2d" } }]);
		const item = items[0].copy();
		const recurrences = item.recurrence?.totalRecurrences;

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
		const recurrences = item.recurrence?.totalRecurrences;

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
		const recurrences = item.recurrence?.totalRecurrences;

		expect(recurrences).toBe(8);
	});
});

describe("untilNRecurrences", () => {
	it("should create a recurrence for a single time item", () => {
		const recurrence = ItemRecurrence.untilNRecurrences(
			DateValueObject.createNowDate(),
			new ItemRecurrenceFrequency("2d"),
			new NumberValueObject(1)
		);

		expect(recurrence.totalRecurrences).toBe(1);
	});

	it("should create a recurrence for a scheduled item with 5 recurrences", () => {
		const recurrence = ItemRecurrence.untilNRecurrences(
			new DateValueObject(new Date(2024, 0, 1)),
			new ItemRecurrenceFrequency("2d"),
			new NumberValueObject(5)
		);

		expect(recurrence.untilDate?.value).toEqual(new Date(2024, 0, 9));
		expect(recurrence.totalRecurrences).toBe(5);
	});

	it("should create a recurrence for a scheduled item with 3 recurrences", () => {
		const recurrence = ItemRecurrence.untilNRecurrences(
			new DateValueObject(new Date(2024, 0, 1)),
			new ItemRecurrenceFrequency("1mo"),
			new NumberValueObject(3)
		);

		expect(recurrence.untilDate?.value).toEqual(new Date(2024, 2, 1));
		expect(recurrence.totalRecurrences).toBe(3);
	});
});
