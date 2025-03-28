import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { TransactionCriteria } from "contexts/Transactions/domain/transaction.criteria";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";

export type GroupByYearMonthDay = {
	[year: number]: {
		[month: string]: {
			[day: number]: Transaction[];
		};
	};
};

export interface IReportsService {
	groupTransactionsByYearMonthDay(filters: {
		accountFilter?: AccountID;
		categoryFilter?: CategoryID;
		subCategoryFilter?: SubCategoryID;
	}): Promise<GroupByYearMonthDay>;
	groupTransactionsByCategories(criteria?: TransactionCriteria): Promise<
		{
			category: CategoryID;
			transactions: Transaction[];
		}[]
	>;
	groupTransactionsBySubcategories(criteria?: TransactionCriteria): Promise<
		{
			subcategory: SubCategoryID;
			transactions: Transaction[];
		}[]
	>;
}
