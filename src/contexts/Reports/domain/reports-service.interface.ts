import { CategoryName } from "contexts/Categories/domain/category-name.valueobject";
import { Criteria } from "contexts/Shared/domain/criteria";
import { SubcategoryName } from "contexts/Subcategories/domain/subcategory-name.valueobject";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { ReportBalance } from "./report-balance.valueobject";
import { TransactionCriteria } from "contexts/Transactions/domain/transaction.criteria";

export type GroupByYearMonthDay = {
	[year: number]: {
		[month: string]: {
			[day: number]: Transaction[];
		};
	};
};

export interface IReportsService {
	groupTransactionsByYearMonthDay(
		criteria?: TransactionCriteria
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
