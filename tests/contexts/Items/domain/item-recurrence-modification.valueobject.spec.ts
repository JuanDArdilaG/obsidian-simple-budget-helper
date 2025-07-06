import {
	ERecurrenceState,
	ItemBrand,
	ItemDate,
	ItemPrice,
	ItemRecurrenceInfo,
	ItemStore,
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

describe("brand and store", () => {
	it("should handle brand and store modifications", () => {
		const brand = new ItemBrand("Test Brand");
		const store = new ItemStore("Test Store");

		const itemRecurrenceModification = new ItemRecurrenceInfo(
			ItemDate.createNowDate(),
			ERecurrenceState.PENDING,
			undefined,
			undefined,
			brand,
			store
		);

		expect(itemRecurrenceModification.brand?.value).toBe("Test Brand");
		expect(itemRecurrenceModification.store?.value).toBe("Test Store");
	});

	it("should update brand and store", () => {
		const itemRecurrenceModification = new ItemRecurrenceInfo(
			ItemDate.createNowDate(),
			ERecurrenceState.PENDING
		);

		const newBrand = new ItemBrand("New Brand");
		const newStore = new ItemStore("New Store");

		itemRecurrenceModification.updateBrand(newBrand);
		itemRecurrenceModification.updateStore(newStore);

		expect(itemRecurrenceModification.brand?.value).toBe("New Brand");
		expect(itemRecurrenceModification.store?.value).toBe("New Store");
	});

	it("should handle undefined brand and store", () => {
		const itemRecurrenceModification = new ItemRecurrenceInfo(
			ItemDate.createNowDate(),
			ERecurrenceState.PENDING
		);

		itemRecurrenceModification.updateBrand(undefined);
		itemRecurrenceModification.updateStore(undefined);

		expect(itemRecurrenceModification.brand).toBeUndefined();
		expect(itemRecurrenceModification.store).toBeUndefined();
	});
});

describe("toPrimitives and fromPrimitives", () => {
	it("should serialize and deserialize with brand and store", () => {
		const brand = new ItemBrand("Test Brand");
		const store = new ItemStore("Test Store");

		const original = new ItemRecurrenceInfo(
			ItemDate.createNowDate(),
			ERecurrenceState.PENDING,
			undefined,
			undefined,
			brand,
			store
		);

		const primitives = original.toPrimitives();
		const restored = ItemRecurrenceInfo.fromPrimitives(primitives);

		expect(restored.brand?.value).toBe("Test Brand");
		expect(restored.store?.value).toBe("Test Store");
		expect(restored.state).toBe(ERecurrenceState.PENDING);
	});
});

describe("getRealPriceForAccount", () => {
	it("should get real price for account for a expense item", () => {
		const account = buildTestAccounts(1)[0];
		const item = buildTestItems([
			{
				operation: ItemOperation.expense(),
				account: account.id,
				modifications: [
					{
						date: ItemDate.createNowDate(),
						state: ERecurrenceState.PENDING,
						fromSplits: [
							{
								accountId: account.id.value,
								amount: 200,
							},
						],
					},
				],
			},
		])[0];

		const result = item.recurrence.recurrences[0].getRealPriceForAccount(
			ItemOperation.expense(),
			account,
			new ItemPrice(
				-item.fromSplits.reduce((sum, s) => sum + s.amount.value, 0)
			),
			item.fromSplits[0]?.accountId,
			item.toSplits[0]?.accountId
		);

		expect(result.value).toBe(-200);
	});
});
