import { NumberValueObject } from "@juandardilag/value-objects";
import { CategoriesWithSubcategoriesMap } from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { Category } from "contexts/Categories/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { Subcategory } from "contexts/Subcategories/domain";
import { AccountsMap } from "../../Accounts/application/get-all-accounts.usecase";
import { ScheduledTransaction } from "../../ScheduledTransactions/domain";
import { ReportBalance } from "./report-balance.valueobject";

export class ScheduledCategoriesReport {
	readonly _ = new Logger("ScheduledCategoriesReport");

	constructor(readonly scheduledTransactions: ScheduledTransaction[]) {}

	onlyExpenses(): ScheduledCategoriesReport {
		return new ScheduledCategoriesReport(
			this.scheduledTransactions.filter((item) =>
				item.operation.type.isExpense(),
			),
		);
	}

	onlyIncomes(): ScheduledCategoriesReport {
		return new ScheduledCategoriesReport(
			this.scheduledTransactions.filter((item) =>
				item.operation.type.isIncome(),
			),
		);
	}

	/**
	 * Returns all items that are expenses (excluding transfers)
	 */
	getExpenseItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter((item) =>
			item.operation.type.isExpense(),
		);
	}

	/**
	 * Returns all items that are incomes (excluding transfers)
	 */
	getIncomeItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter((item) =>
			item.operation.type.isIncome(),
		);
	}

	/**
	 * Returns all transfer items
	 */
	getTransferItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter((item) =>
			item.operation.type.isTransfer(),
		);
	}

	/**
	 * Returns infinite recurrent items
	 */
	getInfiniteRecurrentItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter(
			(item) => item.recurrencePattern.totalOccurrences === -1,
		);
	}

	/**
	 * Returns finite recurrent items
	 */
	getFiniteRecurrentItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter(
			(item) => item.recurrencePattern.totalOccurrences !== -1,
		);
	}

	getTotal(): ReportBalance {
		return this.scheduledTransactions.reduce(
			(total, item) => total.plus(item.realPrice),
			ReportBalance.zero(),
		);
	}

	getTotalPerMonth(accountsMap: AccountsMap): ReportBalance {
		return this.scheduledTransactions.reduce((total, item) => {
			const originAccount = accountsMap.get(
				item.originAccounts[0].accountId.value,
			);
			const destinationAccount =
				item.destinationAccounts.length > 0
					? accountsMap.get(
							item.destinationAccounts[0].accountId.value,
						)
					: undefined;
			if (!originAccount) return total;
			if (item.destinationAccounts.length > 0 && !destinationAccount)
				return total;

			return total.plus(
				item.getPricePerMonthWithAccountTypes(
					originAccount.type.value,
					destinationAccount?.type.value,
				),
			);
		}, ReportBalance.zero());
	}

	groupPerCategory(
		accountsMap: AccountsMap,
		categoriesWithSubcategories: CategoriesWithSubcategoriesMap,
	): {
		perMonthExpensesPercentage: NumberValueObject;
		perMonthInverseOperationPercentage: NumberValueObject;
		items: ItemsWithCategoryAndSubCategory[];
	} {
		const res: ItemsWithCategoryAndSubCategory[] = [];
		const totalExpenses = this.onlyExpenses()
			.getTotalPerMonth(accountsMap)
			.abs();
		const totalIncomes = this.onlyIncomes()
			.getTotalPerMonth(accountsMap)
			.abs();
		const expenses = NumberValueObject.zero();
		const inverseOperation = NumberValueObject.zero();
		this.scheduledTransactions
			.filter((item) => !item.operation.type.isTransfer())
			.forEach((item) => {
				const categoryWithSubCategories =
					categoriesWithSubcategories.get(item.category.value);
				if (!categoryWithSubCategories) return;
				let r = res.find(
					(r) => r.category.category.id === item.category.value,
				);
				if (!r) {
					res.push({
						category: {
							category: categoryWithSubCategories.category,
							percentageOperation: NumberValueObject.zero(),
							percentageInverseOperation:
								NumberValueObject.zero(),
						},
						subCategoriesItems: [],
					});
					r = res.last();
				}
				const originAccount = accountsMap.get(
					item.originAccounts[0].accountId.value,
				);
				const destinationAccount =
					item.destinationAccounts.length > 0
						? accountsMap.get(
								item.destinationAccounts[0].accountId.value,
							)
						: undefined;
				if (!originAccount) return;
				if (item.destinationAccounts.length > 0 && !destinationAccount)
					return;
				const itemPricePerMonth = item.getPricePerMonthWithAccountTypes(
					originAccount.type.value,
					destinationAccount?.type.value,
				);
				if (r?.category.percentageOperation !== undefined)
					r.category.percentageOperation =
						r.category.percentageOperation.plus(
							itemPricePerMonth.abs(),
						);
				let rS = r?.subCategoriesItems.find(
					({ subCategory }) =>
						subCategory.subCategory.id === item.subcategory.value,
				);
				if (!rS) {
					const subCategory =
						categoryWithSubCategories.subcategories.get(
							item.subcategory.value,
						);
					if (!subCategory) return;
					r?.subCategoriesItems.push({
						subCategory: {
							subCategory,
							percentageOperation: NumberValueObject.zero(),
							percentageInverseOperation:
								NumberValueObject.zero(),
						},
						items: [],
					});
					rS = r?.subCategoriesItems.last();
				}
				if (rS?.subCategory.percentageOperation !== undefined)
					rS.subCategory.percentageOperation =
						rS.subCategory.percentageOperation.plus(
							itemPricePerMonth.abs(),
						);
				rS?.items.push({
					item,
					percentageOperation: itemPricePerMonth
						.abs()
						.divide(totalExpenses)
						.times(new NumberValueObject(100))
						.fixed(2),
					percentageInverseOperation: itemPricePerMonth
						.abs()
						.divide(totalIncomes)
						.times(new NumberValueObject(100))
						.fixed(2),
				});
			});
		return {
			perMonthExpensesPercentage: expenses.fixed(2),
			perMonthInverseOperationPercentage: inverseOperation,
			items: res
				.map(
					({
						subCategoriesItems,
						category: { category, percentageOperation },
					}) => ({
						subCategoriesItems: subCategoriesItems.map(
							({
								items,
								subCategory: {
									percentageOperation,
									subCategory,
								},
							}) => ({
								subCategory: {
									percentageOperation: percentageOperation
										.divide(totalExpenses)
										.times(new NumberValueObject(100))
										.fixed(2),
									percentageInverseOperation:
										percentageOperation
											.divide(totalIncomes)
											.times(new NumberValueObject(100))
											.fixed(2),
									subCategory,
								},
								items,
							}),
						),
						category: {
							category,
							percentageOperation: percentageOperation
								.divide(totalExpenses)
								.times(new NumberValueObject(100))
								.fixed(2),
							percentageInverseOperation: percentageOperation
								.divide(totalIncomes)
								.times(new NumberValueObject(100))
								.fixed(2),
						},
					}),
				)
				.sort((rA, rB) =>
					rA.category.category.name.compareTo(
						rB.category.category.name,
					),
				),
		};
	}
}

export type ItemsWithCategoryAndSubCategory = {
	category: {
		category: Category;
		percentageOperation: NumberValueObject;
		percentageInverseOperation: NumberValueObject;
	};
	subCategoriesItems: {
		subCategory: {
			subCategory: Subcategory;
			percentageOperation: NumberValueObject;
			percentageInverseOperation: NumberValueObject;
		};
		items: {
			item: ScheduledTransaction;
			percentageOperation: NumberValueObject;
			percentageInverseOperation: NumberValueObject;
		}[];
	}[];
};
