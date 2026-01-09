import { ItemOperation } from "contexts/Shared/domain";
import { describe, expect, it } from "vitest";
import { ScheduledTransactionDate } from "../../../../src/contexts/Items/domain";
import {
	ItemRecurrenceInfo,
	RecurrenceModificationState,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { buildTestItems } from "./buildTestItems";

describe("updateState", () => {
	it("should updates state", () => {
		const itemRecurrenceModification = new ItemRecurrenceInfo(
			ScheduledTransactionDate.createNowDate(),
			RecurrenceModificationState.PENDING
		);

		itemRecurrenceModification.updateState(
			RecurrenceModificationState.COMPLETED
		);

		expect(itemRecurrenceModification.state).toBe(
			RecurrenceModificationState.COMPLETED
		);
	});
});

describe("brand and store", () => {
	it("should handle brand and store modifications", () => {
		const brand = new ItemBrand("Test Brand");
		const store = new ItemStore("Test Store");

		const itemRecurrenceModification = new ItemRecurrenceInfo(
			Sched.createNowDate(),
			RecurrenceModificationState.PENDING,
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
			Sched.createNowDate(),
			RecurrenceModificationState.PENDING
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
			Sched.createNowDate(),
			RecurrenceModificationState.PENDING
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
			Sched.createNowDate(),
			RecurrenceModificationState.PENDING,
			undefined,
			undefined,
			brand,
			store
		);

		const primitives = original.toPrimitives();
		const restored = ItemRecurrenceInfo.fromPrimitives(primitives);

		expect(restored.brand?.value).toBe("Test Brand");
		expect(restored.store?.value).toBe("Test Store");
		expect(restored.state).toBe(RecurrenceModificationState.PENDING);
	});
});

describe("getRealPriceForAccount", () => {
	it("should get real price for account for a expense item", () => {
		const account = buildTestAccounts(1)[0];
		const item = buildTestItems([
			{
				price: new ItemPrice(216),
				operation: ItemOperation.expense(),
				account: account.id,
			},
		])[0];

		const result = item.recurrence.recurrences[0].getRealPriceForAccount(
			ItemOperation.expense(),
			account,
			item.fromSplits,
			item.toSplits
		);

		expect(result.value).toBe(-216);
	});
});
