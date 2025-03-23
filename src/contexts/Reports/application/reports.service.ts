import {
	GroupByYearMonthDay,
	IReportsService,
} from "../domain/reports-service.interface";
import { CategoryName } from "../../Categories/domain/category-name.valueobject";
import { SubcategoryName } from "../../Subcategories/domain/subcategory-name.valueobject";
import { ReportBalance } from "../domain/report-balance.valueobject";
import {
	Transaction,
	TransactionCriteria,
	ITransactionsRepository,
} from "contexts/Transactions/domain";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubcategoryID } from "contexts/Subcategories/domain";
import { TransactionsReport } from "../domain";

export class ReportsService implements IReportsService {
	constructor(private _transactionsRepository: ITransactionsRepository) {}

	async groupTransactionsByCategories(
		criteria?: TransactionCriteria
	): Promise<{ category: CategoryName; transactions: Transaction[] }[]> {
		const transactions = await this._transactionsRepository.findByCriteria(
			criteria ?? new TransactionCriteria()
		);
		const result: {
			category: CategoryName;
			transactions: Transaction[];
		}[] = [];
		for (const transaction of transactions) {
			let i = result.findIndex((existing) =>
				existing.category.equalTo(transaction.categoryID)
			);
			if (i === -1) {
				i = result.length;
				result.push({
					category: transaction.categoryID,
					transactions: [],
				});
			}
			result[i].transactions.push(transaction);
		}
		return result;
	}

	async groupTransactionsBySubcategories(
		criteria?: TransactionCriteria
	): Promise<
		{ subcategory: SubcategoryName; transactions: Transaction[] }[]
	> {
		const transactions = await this._transactionsRepository.findByCriteria(
			criteria ?? new TransactionCriteria()
		);
		const result: {
			subcategory: SubcategoryName;
			transactions: Transaction[];
		}[] = [];
		for (const transaction of transactions) {
			let i = result.findIndex((existing) =>
				existing.subcategory.equalTo(transaction.subCategory)
			);
			if (i === -1) {
				i = result.length;
				result.push({
					subcategory: transaction.subCategory,
					transactions: [],
				});
			}
			result[i].transactions.push(transaction);
		}
		return result;
	}

	async groupTransactionsByYearMonthDay({
		accountFilter,
		categoryFilter,
		subCategoryFilter,
	}: {
		accountFilter?: AccountID;
		categoryFilter?: CategoryID;
		subCategoryFilter?: SubcategoryID;
	}): Promise<GroupByYearMonthDay> {
		const filterCriteria = new TransactionCriteria();
		if (accountFilter) filterCriteria.where("account", accountFilter.value);

		if (categoryFilter)
			filterCriteria.where("category", categoryFilter.value);

		if (subCategoryFilter)
			filterCriteria.where("subCategory", subCategoryFilter.value);

		let transactions = await this._transactionsRepository.findByCriteria(
			filterCriteria
		);

		if (accountFilter) {
			const filterCriteria = new TransactionCriteria();
			if (accountFilter)
				filterCriteria.where("toAccount", accountFilter.value);

			if (categoryFilter)
				filterCriteria.where("category", categoryFilter.value);

			if (subCategoryFilter)
				filterCriteria.where("subCategory", subCategoryFilter.value);

			const transactionsToAccount =
				await this._transactionsRepository.findByCriteria(
					filterCriteria
				);

			transactions.push(...transactionsToAccount);
		}

		return new TransactionsReport(transactions).groupByDays();
	}

	async getTransactionsBalance(
		criteria?: TransactionCriteria
	): Promise<ReportBalance> {
		const transactions = await this._transactionsRepository.findByCriteria(
			criteria ?? new TransactionCriteria()
		);
		// const untilIDIndex = config?.untilID
		// 	? this._history.findIndex((item) => item.id === config?.untilID)
		// 	: -1;
		// const untilID =
		// 	untilIDIndex !== -1 ? untilIDIndex : this.history.length - 1;
		return new ReportBalance(
			transactions
				// .slice(0, config?.dropLast ? untilID : untilID + 1)
				.reduce((total, transaction) => {
					return (
						total +
						transaction.amount.toNumber() *
							(transaction.operation.isExpense()
								? -1
								: transaction.operation.isIncome()
								? 1
								: 0)
					);
				}, 0)
		);
	}
}
