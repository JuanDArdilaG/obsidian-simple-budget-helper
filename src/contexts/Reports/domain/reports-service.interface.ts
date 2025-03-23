import { CategoryName } from "contexts/Categories/domain/category-name.valueobject";
import { SubcategoryName } from "contexts/Subcategories/domain/subcategory-name.valueobject";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { ReportBalance } from "./report-balance.valueobject";
import { TransactionCriteria } from "contexts/Transactions/domain/transaction.criteria";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubcategoryID } from "contexts/Subcategories/domain";

export type GroupByYearMonthDay = {
	[year: number]: {
		[month: string]: {
			[day: number]: Transaction[];
		};
	};
};

export interface IReportsService {
	groupTransactionsByYearMonthDay(
		filters: {
			accountFilter?: AccountID;
			categoryFilter?: CategoryID;
			subCategoryFilter?: SubcategoryID;
		}
	): Promise<GroupByYearMonthDay>;
	groupTransactionsByCategories(criteria?: TransactionCriteria): Promise<
		{
			category: CategoryName;
			transactions: Transaction[];
		}[]
	>;
	groupTransactionsBySubcategories(criteria?: TransactionCriteria): Promise<
		{
			subcategory: SubcategoryName;
			transactions: Transaction[];
		}[]
	>;
	getTransactionsBalance(
		criteria?: TransactionCriteria
	): Promise<ReportBalance>;
}
