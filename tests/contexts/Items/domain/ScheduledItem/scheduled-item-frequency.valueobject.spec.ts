import { ScheduledItemFrequency } from "contexts/ScheduledItems/domain";
import { describe, expect, it } from "vitest";

describe("toDaysNumber", () => {
	it("should return the correct frequency object for a simple year frequency", () => {
		const frequency = new ScheduledItemFrequency("1y");

		const freqObj = frequency.toObject();

		expect(freqObj).toEqual({ years: 1, months: 0, days: 0 });
	});

	it("should return the correct frequency object for a complex frequency", () => {
		const frequency = new ScheduledItemFrequency("1y2mo3w4d");

		const freqObj = frequency.toObject();

		expect(freqObj).toEqual({
			years: 1,
			months: 2,
			days: 3 * 7 + 4,
		});
	});

	it("should return the correct number of days for a simple month frequency", () => {
		const frequency = new ScheduledItemFrequency("1mo");

		const days = frequency.toNumberOfDays();

		expect(days).toEqual(ScheduledItemFrequency.MONTH_DAYS_RELATION);
	});

	it("should return the correct number of days for a complex frequency", () => {
		const frequency = new ScheduledItemFrequency("2y5mo2d");

		const days = frequency.toNumberOfDays();

		expect(days).toEqual(884.0835);
	});
});
