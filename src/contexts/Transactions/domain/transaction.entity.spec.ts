import { beforeAll, describe, expect, it } from "vitest";
import { Transaction, TransactionPrimitives } from "./transaction.entity";
import { TransactionID } from "./transaction-id.valueobject";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemName } from "contexts/Items/domain/item-name.valueobject";
import { TransactionOperation } from "./transaction-operation.valueobject";
import { TransactionDate } from "./transaction-date.valueobject";
import { TransactionAmount } from "./transaction-amount.valueobject";
import { TransactionCategory } from "./transaction-category.valueobject";
import { TransactionSubcategory } from "./transaction-subcategory.valueobject";

describe("toString", () => {
	let mockTransaction: Transaction;
	let primitives: TransactionPrimitives;
	beforeAll(() => {
		mockTransaction = new Transaction(
			TransactionID.generate(),
			ItemID.generate(),
			AccountID.generate(),
			new ItemName("name"),
			new TransactionOperation("expense"),
			new TransactionCategory("test"),
			new TransactionSubcategory("test"),
			new TransactionDate(new Date(2024, 0, 1, 15, 35)),
			new TransactionAmount(100)
		);
		primitives = mockTransaction.toPrimitives();
	});

	it("should return a string representation of the Transaction", () => {
		const str = mockTransaction.toString();

		expect(str).toBe(
			`- id: ${primitives.id}. name: ${primitives.name}. account: ${
				primitives.account
			}. date: ${
				primitives.date.toString().split(" GMT")[0]
			}. amount: ${mockTransaction.amount.toString(true, 0)}`
		);
	});
});
