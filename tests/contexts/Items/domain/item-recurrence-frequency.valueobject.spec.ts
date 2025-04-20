import { ItemRecurrenceFrequency } from "contexts/Items/domain";
import { describe, expect, it } from "vitest";

describe("toDaysNumber", () => {
	it("should return the correct frequency object for a simple year frequency", () => {
		const frequency = new ItemRecurrenceFrequency("1y");

		const freqObj = frequency.toObject();

		expect(freqObj?.years.value).toEqual(1);
		expect(freqObj?.months.value).toEqual(0);
		expect(freqObj?.days.value).toEqual(0);
	});

	it("should return the correct frequency object for a complex frequency", () => {
		const frequency = new ItemRecurrenceFrequency("1y2mo3w4d");

		const freqObj = frequency.toObject();

		expect(freqObj?.years.value).toEqual(1);
		expect(freqObj?.months.value).toEqual(2);
		expect(freqObj?.days.value).toEqual(3 * 7 + 4);
	});

	it("should return the correct number of days for a simple month frequency", () => {
		const frequency = new ItemRecurrenceFrequency("1mo");

		const days = frequency.toNumberOfDays();

		expect(days).toEqual(ItemRecurrenceFrequency.MONTH_DAYS_RELATION);
	});

	it("should return the correct number of days for a complex frequency", () => {
		const frequency = new ItemRecurrenceFrequency("2y5mo2d");

		const days = frequency.toNumberOfDays();

		expect(days.value).toEqual(884.0835);
	});
});
