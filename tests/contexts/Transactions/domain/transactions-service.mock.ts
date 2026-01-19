import { AccountBalance } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import {
	ITransactionsService,
	Transaction,
	TransactionID,
} from "contexts/Transactions/domain";
import { Nanoid } from "../../../../src/contexts/Shared/domain";

export class TransactionsServiceMock implements ITransactionsService {
	constructor(public transactions: Transaction[]) {}

	async getByID(id: TransactionID): Promise<Transaction> {
		throw new Error("not implemented");
	}

	async delete(id: TransactionID): Promise<void> {
		throw new Error("not implemented");
	}

	async record(transaction: Transaction): Promise<void> {
		this.transactions.push(transaction);
	}

	async accountAdjustment(
		accountID: Nanoid,
		newBalance: AccountBalance,
	): Promise<void> {
		throw new Error("not implemented");
	}

	async getByCategory(category: CategoryID): Promise<Transaction[]> {
		throw new Error("not implemented");
	}

	async getBySubCategory(subCategory: SubCategoryID): Promise<Transaction[]> {
		throw new Error("not implemented");
	}

	async hasTransactionsByCategory(category: CategoryID): Promise<boolean> {
		throw new Error("not implemented");
	}

	async hasTransactionsBySubCategory(
		subCategory: SubCategoryID,
	): Promise<boolean> {
		throw new Error("not implemented");
	}

	async reassignTransactionsCategory(
		oldCategory: CategoryID,
		newCategory: CategoryID,
	): Promise<void> {
		throw new Error("not implemented");
	}

	async reassignTransactionsSubCategory(
		oldSubCategory: SubCategoryID,
		newSubCategory: SubCategoryID,
	): Promise<void> {
		throw new Error("not implemented");
	}

	async reassignTransactionsCategoryAndSubcategory(
		oldCategory: CategoryID,
		newCategory: CategoryID,
		newSubCategory: SubCategoryID,
	): Promise<void> {
		throw new Error("not implemented");
	}

	async update(transaction: Transaction): Promise<void> {
		throw new Error("not implemented");
	}

	async getAll(): Promise<Transaction[]> {
		throw new Error("not implemented");
	}

	async getTransactionsByCategory(
		category: CategoryID,
	): Promise<Array<Transaction>> {
		throw new Error("not implemented");
	}

	async getTransactionsBySubCategory(
		subCategory: SubCategoryID,
	): Promise<Array<Transaction>> {
		throw new Error("not implemented");
	}
}
