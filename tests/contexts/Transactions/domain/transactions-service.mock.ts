import { AccountBalance } from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import {
	ITransactionsService,
	Transaction,
} from "contexts/Transactions/domain";
import { Nanoid } from "../../../../src/contexts/Shared/domain";

export class TransactionsServiceMock implements ITransactionsService {
	constructor(public transactions: Transaction[]) {}
	async getByAccount(accountId: Nanoid): Promise<Transaction[]> {
		throw new Error("not implemented");
	}

	async getByID(id: Nanoid): Promise<Transaction> {
		throw new Error("not implemented");
	}

	async delete(id: Nanoid): Promise<void> {
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

	async getByCategory(category: Nanoid): Promise<Transaction[]> {
		throw new Error("not implemented");
	}

	async getBySubCategory(subCategory: Nanoid): Promise<Transaction[]> {
		throw new Error("not implemented");
	}

	async hasTransactionsByCategory(category: Nanoid): Promise<boolean> {
		throw new Error("not implemented");
	}

	async hasTransactionsBySubCategory(subCategory: Nanoid): Promise<boolean> {
		throw new Error("not implemented");
	}

	async reassignTransactionsCategory(
		oldCategory: Category,
		newCategory: Category,
	): Promise<void> {
		throw new Error("not implemented");
	}

	async reassignTransactionsSubCategory(
		oldSubCategory: Nanoid,
		newSubCategory: Nanoid,
	): Promise<void> {
		throw new Error("not implemented");
	}

	async reassignTransactionsCategoryAndSubcategory(
		oldCategory: Nanoid,
		newCategory: Nanoid,
		newSubCategory: Nanoid,
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
		category: Nanoid,
	): Promise<Array<Transaction>> {
		throw new Error("not implemented");
	}

	async getTransactionsBySubCategory(
		subCategory: Nanoid,
	): Promise<Array<Transaction>> {
		throw new Error("not implemented");
	}
}
