import {
	ERecurrenceState,
	ItemDate,
	ItemID,
	ItemPrice,
	ItemRecurrenceModification,
} from "contexts/Items/domain";
import { describe, expect, it } from "vitest";
import { buildTestItems } from "./buildTestItems";
import { ItemOperation } from "contexts/Shared/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

describe("updateState", () => {
	it("should updates state", () => {
		const itemRecurrenceModification = new ItemRecurrenceModification(
			ItemID.generate(),
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
				operation: ItemOperation.expense(),
				account: account.id,
				recurrences: [
					{
						date: ItemDate.createNowDate(),
						state: ERecurrenceState.PENDING,
						amount: 200,
					},
				],
			},
		])[0];

		const result = item.recurrences[0].getRealPriceForAccount(
			ItemOperation.expense(),
			account,
			item.price,
			item.account,
			item.toAccount
		);

		expect(result.value).toBe(-200);
	});
});
