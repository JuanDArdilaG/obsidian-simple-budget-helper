import { describe, expect, it } from "vitest";
import { buildTestItems } from "../../Items/domain/buildTestItems";
import { ScheduledItemsReport } from "contexts/Reports/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { ItemPrice } from "../../../../src/contexts/SimpleItems/domain/item-price.valueobject";

describe("withAccumulatedBalance", () => {
	it("transfer item should generate two items (income and transfer)", () => {
		const accounts = buildTestAccounts(2);
		const { scheduled } = buildTestItems({
			scheduled: [
				{
					price: new ItemPrice(100),
					account: accounts[0].id,
					toAccount: accounts[1].id,
				},
			],
		});
		const report = new ScheduledItemsReport(scheduled);

		const withAccumulatedBalance = report.withAccumulatedBalance(accounts);

		expect(withAccumulatedBalance).toHaveLength(2);
		expect(withAccumulatedBalance[0].balance.valueOf()).toEqual(-100);
		expect(withAccumulatedBalance[1].balance.valueOf()).toEqual(100);
	});
});
