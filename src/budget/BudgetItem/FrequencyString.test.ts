import { FrequencyString } from "./FrequencyString";

describe("toDaysNumber", () => {
	it("should return the correct number of days for a simple year frequency", () => {
		const frequency = new FrequencyString("1y");

		const freqObj = frequency.toObject();

		expect(freqObj).toEqual({ years: 1, months: 0, days: 0 });
	});

	it("should return the correct number of days for a complex frequency", () => {
		const frequency = new FrequencyString("1y2mo3w4d5h6m7s");

		const freqObj = frequency.toObject();

		expect(freqObj).toEqual({
			years: 1,
			months: 2,
			days: 3 * 7 + 4,
		});
	});
});
