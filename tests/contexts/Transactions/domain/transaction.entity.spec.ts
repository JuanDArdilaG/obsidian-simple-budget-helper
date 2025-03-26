import { beforeAll, describe, expect, it } from "vitest";
import { AccountID } from "../../../../src/contexts/Accounts/domain/account-id.valueobject";
import { ItemID } from "../../../../src/contexts/Items/domain/item-id.valueobject";
import { ItemName } from "../../../../src/contexts/Items/domain/item-name.valueobject";
import { TransactionAmount } from "../../../../src/contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionDate } from "../../../../src/contexts/Transactions/domain/transaction-date.valueobject";
import { TransactionID } from "../../../../src/contexts/Transactions/domain/transaction-id.valueobject";
import { TransactionOperation } from "../../../../src/contexts/Transactions/domain/transaction-operation.valueobject";
import {
	TransactionPrimitives,
	Transaction,
} from "../../../../src/contexts/Transactions/domain/transaction.entity";
import { CategoryID } from "../../../../src/contexts/Categories/domain/category-id.valueobject";
import { SubCategoryID } from "../../../../src/contexts/Subcategories/domain/subcategory-id.valueobject";

describe("toString", () => {
	let mockTransaction: Transaction;
	let primitives: TransactionPrimitives;
	beforeAll(() => {
		mockTransaction = new Transaction(
			TransactionID.generate(),
			AccountID.generate(),
			new ItemName("name"),
			new TransactionOperation("expense"),
			CategoryID.generate(),
			SubCategoryID.generate(),
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
