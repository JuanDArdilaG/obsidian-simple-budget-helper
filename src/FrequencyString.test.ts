import { FrequencyString } from "./FrequencyString";

describe("toDaysNumber", () => {
	it("should return the correct number of days for a simple year frequency", () => {
		const frequency = new FrequencyString("1y");

		const days = frequency.toDaysNumber();

		expect(days).toBe(365);
	});

	it("should return the correct number of days for a complex frequency", () => {
		const frequency = new FrequencyString("1y2mo3w4d5h6m7s");

		const days = frequency.toDaysNumber();

		expect(days).toBe(
			365 + 2 * 30.4167 + 3 * 7 + 4 + 5 * 24 + 6 * 60 + 7 * 60
		);
	});
});
