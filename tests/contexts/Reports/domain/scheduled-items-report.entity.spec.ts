import { describe, expect, it } from "vitest";
import { buildTestItems } from "../../Items/domain/buildTestItems";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { ItemPrice } from "contexts/Items/domain";
import { ItemsReport } from "contexts/Reports/domain/items-report.entity";

describe("withAccumulatedBalance", () => {
	it("transfer item should generate two items (income and transfer)", () => {
		const accounts = buildTestAccounts(2);
		const items = buildTestItems([
			{
				price: new ItemPrice(100),
				account: accounts[0].id,
				toAccount: accounts[1].id,
			},
		]);
		const report = new ItemsReport(items);

		const withAccumulatedBalance = report.withAccumulatedBalance(accounts);

		expect(withAccumulatedBalance).toHaveLength(2);
		expect(withAccumulatedBalance[0].balance.value).toEqual(-100);
		expect(withAccumulatedBalance[1].balance.value).toEqual(100);
	});
});
