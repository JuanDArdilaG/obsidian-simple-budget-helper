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
				existing.category.equal(transaction.category)
			);
			if (i === -1) {
				i = result.length;
				result.push({
					category: transaction.category,
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
				existing.subcategory.equal(transaction.subCategory)
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

	async groupTransactionsByYearMonthDay(
		criteria?: TransactionCriteria
	): Promise<GroupByYearMonthDay> {
		const transactions = await this._transactionsRepository.findByCriteria(
			criteria ?? new TransactionCriteria()
		);

		return transactions.reduce((group, transaction) => {
			const year = transaction.date.getYear();
			const month = transaction.date.getMonthNameAbbreviation();
			const day = transaction.date.getDay();

			if (!group[year]) group[year] = {};
			if (!group[year][month]) group[year][month] = {};
			if (!group[year][month][day]) group[year][month][day] = [];
			group[year][month][day].push(transaction);

			return group;
		}, {} as GroupByYearMonthDay);
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

	// static fromGroupByYearMonthDay(groupedByYearMonthDay: GroupByYearMonthDay) {
	// 	return new BudgetHistory(
	// 		(
	// 			Object.values(
	// 				Object.values(groupedByYearMonthDay) as object[]
	// 			) as BudgetItemRecord[]
	// 		)
	// 			.flat()
	// 			.flat()
	// 	);
	// }
}
