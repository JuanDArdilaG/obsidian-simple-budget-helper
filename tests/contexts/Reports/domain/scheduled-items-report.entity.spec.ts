import { describe, expect, it } from "vitest";
import { buildTestItems } from "../../Items/domain/buildTestItems";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { ItemPrice } from "contexts/Items/domain";
import { ItemsReport } from "contexts/Reports/domain/items-report.entity";

describe("withAccumulatedBalance", () => {
	it("one transfer item should return account and toAccount balances", () => {
		const accounts = buildTestAccounts(2);
		const items = buildTestItems([
			{
				price: new ItemPrice(100),
				account: accounts[0].id,
				toAccount: accounts[1].id,
			},
		]);
		const report = new ItemsReport(items);

		const withAccumulatedBalance = report.execute(accounts);

		expect(withAccumulatedBalance).toHaveLength(1);
		expect(withAccumulatedBalance[0].accountPrevBalance.value).toEqual(0);
		expect(withAccumulatedBalance[0].accountBalance.value).toEqual(-100);
		expect(withAccumulatedBalance[0].toAccountPrevBalance?.value).toEqual(
			0
		);
		expect(withAccumulatedBalance[0].toAccountBalance?.value).toEqual(100);
	});
});
