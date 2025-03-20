import { describe, expect, it } from "vitest";
import { dateStringToDate, getLastDayOfMonth } from "./date";

describe("dateStringToDate", () => {
	it("should convert a date string to a Date object", () => {
		const strDate = "2023-01-01";

		const date = dateStringToDate(strDate);

		expect(date.getFullYear()).toBe(2023);
		expect(date.getMonth()).toBe(0);
		expect(date.getDate()).toBe(1);
	});
});

describe("getLastDayOfMonth", () => {
	it("should return the last day of the month for a given year and monthIndex", () => {
		const year = 2023;
		const monthIndex = 1; // February

		const lastDay = getLastDayOfMonth(year, monthIndex);

		expect(lastDay).toBe(28);
	});
});
