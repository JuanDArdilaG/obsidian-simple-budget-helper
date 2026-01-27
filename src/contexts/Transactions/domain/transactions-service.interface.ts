import { AccountBalance } from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import { Nanoid } from "../../Shared/domain";
import { Transaction } from "./transaction.entity";

export interface ITransactionsService {
	record(transaction: Transaction): Promise<void>;
	accountAdjustment(
		accountID: Nanoid,
		newBalance: AccountBalance,
	): Promise<void>;

	getAll(): Promise<Transaction[]>;
	getByID(id: Nanoid): Promise<Transaction>;
	getByCategory(category: Nanoid): Promise<Transaction[]>;
	getBySubCategory(subCategory: Nanoid): Promise<Transaction[]>;
	getByAccount(accountId: Nanoid): Promise<Transaction[]>;
	hasTransactionsByCategory(category: Nanoid): Promise<boolean>;
	hasTransactionsBySubCategory(subCategory: Nanoid): Promise<boolean>;
	reassignTransactionsCategory(
		oldCategory: Category,
		newCategory: Category,
	): Promise<void>;
	reassignTransactionsSubCategory(
		oldSubCategory: Nanoid,
		newSubCategory: Nanoid,
	): Promise<void>;
	reassignTransactionsCategoryAndSubcategory(
		oldCategory: Nanoid,
		newCategory: Nanoid,
		newSubCategory: Nanoid,
	): Promise<void>;
	update(transaction: Transaction): Promise<void>;
	delete(id: Nanoid): Promise<void>;
	getTransactionsByCategory(category: Nanoid): Promise<Array<Transaction>>;
	getTransactionsBySubCategory(
		subCategory: Nanoid,
	): Promise<Array<Transaction>>;
}
