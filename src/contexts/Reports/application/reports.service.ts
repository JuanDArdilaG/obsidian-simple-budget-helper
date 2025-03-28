import {
	GroupByYearMonthDay,
	IReportsService,
} from "../domain/reports-service.interface";
import { CategoryName } from "../../Categories/domain/category-name.valueobject";
import { SubCategoryName } from "../../Subcategories/domain/subcategory-name.valueobject";
import {
	Transaction,
	TransactionCriteria,
	ITransactionsRepository,
} from "contexts/Transactions/domain";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { TransactionsReport } from "../domain";

export class ReportsService implements IReportsService {
	constructor(private _transactionsRepository: ITransactionsRepository) {}

	async groupTransactionsByCategories(
		criteria?: TransactionCriteria
	): Promise<{ category: CategoryID; transactions: Transaction[] }[]> {
		const transactions = await this._transactionsRepository.findByCriteria(
			criteria ?? new TransactionCriteria()
		);
		const result: {
			category: CategoryID;
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
	): Promise<{ subcategory: SubCategoryID; transactions: Transaction[] }[]> {
		const transactions = await this._transactionsRepository.findByCriteria(
			criteria ?? new TransactionCriteria()
		);
		const result: {
			subcategory: SubCategoryID;
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
		subCategoryFilter?: SubCategoryID;
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
}
