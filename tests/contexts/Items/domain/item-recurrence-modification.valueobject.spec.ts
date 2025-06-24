import {
	ERecurrenceState,
	ItemDate,
	ItemPrice,
	ItemRecurrenceInfo,
} from "contexts/Items/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { describe, expect, it } from "vitest";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { buildTestItems } from "./buildTestItems";

describe("updateState", () => {
	it("should updates state", () => {
		const itemRecurrenceModification = new ItemRecurrenceInfo(
			ItemDate.createNowDate(),
			ERecurrenceState.PENDING
		);

		itemRecurrenceModification.updateState(ERecurrenceState.COMPLETED);

		expect(itemRecurrenceModification.state).toBe(
			ERecurrenceState.COMPLETED
		);
	});
});

describe("getRealPriceForAccount", () => {
	it("should get real price for account for a expense item", () => {
		const account = buildTestAccounts(1)[0];
		const item = buildTestItems([
			{
				price: new ItemPrice(100),
				operation: ItemOperation.expense(account.id),
				account: account.id,
				modifications: [
					{
						date: ItemDate.createNowDate(),
						state: ERecurrenceState.PENDING,
						amount: 200,
					},
				],
			},
		])[0];

		const result = item.recurrence.recurrences[0].getRealPriceForAccount(
			ItemOperation.expense(account.id),
			account,
			new ItemPrice(
				-item.fromSplits.reduce((sum, s) => sum + s.amount.value, 0)
			),
			item.operation.account,
			item.operation.toAccount
		);

		expect(result.value).toBe(-200);
	});
});
