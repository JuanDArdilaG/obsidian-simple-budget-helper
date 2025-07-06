import { AccountBalance, AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import {
	ITransactionsService,
	Transaction,
	TransactionID,
} from "contexts/Transactions/domain";

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
		accountID: AccountID,
		newBalance: AccountBalance
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
		subCategory: SubCategoryID
	): Promise<boolean> {
		throw new Error("not implemented");
	}

	async reassignTransactionsCategory(
		oldCategory: CategoryID,
		newCategory: CategoryID
	): Promise<void> {
		throw new Error("not implemented");
	}

	async reassignTransactionsSubCategory(
		oldSubCategory: SubCategoryID,
		newSubCategory: SubCategoryID
	): Promise<void> {
		throw new Error("not implemented");
	}

	async reassignTransactionsCategoryAndSubcategory(
		oldCategory: CategoryID,
		newCategory: CategoryID,
		newSubCategory: SubCategoryID
	): Promise<void> {
		throw new Error("not implemented");
	}

	async update(transaction: Transaction): Promise<void> {
		throw new Error("not implemented");
	}

	async getAll(): Promise<Transaction[]> {
		throw new Error("not implemented");
	}

	async getTransactionSummariesByCategory(category: CategoryID): Promise<
		Array<{
			id: string;
			name: string;
			amount: number;
			date: string;
			operation: "income" | "expense" | "transfer";
			account?: string;
		}>
	> {
		throw new Error("not implemented");
	}

	async getTransactionSummariesBySubCategory(
		subCategory: SubCategoryID
	): Promise<
		Array<{
			id: string;
			name: string;
			amount: number;
			date: string;
			operation: "income" | "expense" | "transfer";
			account?: string;
		}>
	> {
		throw new Error("not implemented");
	}
}
