import { describe, expect, it } from "vitest";
import { AccountBalance } from "../../../../src/contexts/Accounts/domain/account-balance.valueobject";
import { PriceValueObject } from "@juandardilag/value-objects";

describe("adjust", () => {
	it("should sustract", () => {
		const balance = new AccountBalance(new PriceValueObject(-384));
		const newBalance = new AccountBalance(PriceValueObject.zero());

		const difference = balance.adjust(newBalance.value);

		expect(difference.toNumber()).toBe(384);
	});
});
