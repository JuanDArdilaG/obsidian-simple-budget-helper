import { AccountBalance } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Nanoid } from "../../Shared/domain";
import { TransactionID } from "./transaction-id.valueobject";
import { Transaction } from "./transaction.entity";

export interface ITransactionsService {
	record(transaction: Transaction): Promise<void>;
	accountAdjustment(
		accountID: Nanoid,
		newBalance: AccountBalance,
	): Promise<void>;

	getAll(): Promise<Transaction[]>;
	getByID(id: TransactionID): Promise<Transaction>;
	getByCategory(category: CategoryID): Promise<Transaction[]>;
	getBySubCategory(subCategory: SubCategoryID): Promise<Transaction[]>;
	hasTransactionsByCategory(category: CategoryID): Promise<boolean>;
	hasTransactionsBySubCategory(subCategory: SubCategoryID): Promise<boolean>;
	reassignTransactionsCategory(
		oldCategory: CategoryID,
		newCategory: CategoryID,
	): Promise<void>;
	reassignTransactionsSubCategory(
		oldSubCategory: SubCategoryID,
		newSubCategory: SubCategoryID,
	): Promise<void>;
	reassignTransactionsCategoryAndSubcategory(
		oldCategory: CategoryID,
		newCategory: CategoryID,
		newSubCategory: SubCategoryID,
	): Promise<void>;
	update(transaction: Transaction): Promise<void>;
	delete(id: TransactionID): Promise<void>;
	getTransactionsByCategory(
		category: CategoryID,
	): Promise<Array<Transaction>>;
	getTransactionsBySubCategory(
		subCategory: SubCategoryID,
	): Promise<Array<Transaction>>;
}
