import { describe, expect, it } from "vitest";
import { AccountBalance } from "../../../../src/contexts/Accounts/domain/account-balance.valueobject";

describe("adjust", () => {
	it("should sustract", () => {
		const balance = new AccountBalance(-384);
		const newBalance = new AccountBalance(0);

		const difference = balance.adjust(newBalance);

		expect(difference.toNumber()).toBe(384);
	});
});
