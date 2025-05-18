import { describe, expect, it } from "vitest";
import { buildTestItems } from "./buildTestItems";
import { DateValueObject } from "@juandardilag/value-objects";

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

// describe("updateUntilDateFromRecurrencesCount", () => {
// 	it("should update the until date for a single time item", () => {
// 		const items = buildTestItems([
// 			{
// 				recurrence: {
// 					frequency: "2d",
// 					startDate: DateValueObject.createNowDate(),
// 				},
// 			},
// 		]);
// 		const item = items[0].copy();
// 		item.recurrence?.updateUntilDateFromRecurrencesCount(1);

// 		expect(item.recurrence?.untilDate?.value).toEqual(
// 			item.recurrence?.startDate.value
// 		);
// 	});

// 	it("should update the until date for a scheduled item with 5 recurrences", () => {
// 		const items = buildTestItems([
// 			{
// 				recurrence: {
// 					frequency: "2d",
// 					startDate: new DateValueObject(new Date(2024, 0, 1)),
// 				},
// 			},
// 		]);
// 		const item = items[0].copy();
// 		item.recurrence?.updateUntilDateFromRecurrencesCount(5);

// 		expect(item.recurrence?.untilDate?.value).toEqual(
// 			new Date("2024-01-09")
// 		);
// 	});

// 	it("should update the until date for a scheduled item with 5 recurrences", () => {
// 		const items = buildTestItems([
// 			{
// 				recurrence: {
// 					frequency: "1mo",
// 					startDate: new DateValueObject(new Date(2024, 0, 1)),
// 				},
// 			},
// 		]);
// 		const item = items[0].copy();
// 		item.recurrence?.updateUntilDateFromRecurrencesCount(3);

// 		expect(item.recurrence?.untilDate?.value).toEqual(new Date(2024, 2, 1));
// 	});
// });
