import { NumberValueObject } from "@juandardilag/value-objects";
import { AccountID, AccountType } from "contexts/Accounts/domain";
import { GetAllCategoriesWithSubCategoriesUseCaseOutput } from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { Category } from "contexts/Categories/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { SubCategory } from "contexts/Subcategories/domain";
import { ScheduledTransaction } from "../../ScheduledTransactions/domain";
import { ReportBalance } from "./report-balance.valueobject";

export class ScheduledCategoriesReport {
	readonly _ = new Logger("ScheduledCategoriesReport");
	private static readonly defaultAccountTypeLookup = () => {
		return new AccountType("asset");
	};

	constructor(readonly scheduledTransactions: ScheduledTransaction[]) {}

	onlyExpenses(): ScheduledCategoriesReport {
		return new ScheduledCategoriesReport(
			this.scheduledTransactions.filter((item) =>
				item.operation.type.isExpense()
			)
		);
	}

	onlyIncomes(): ScheduledCategoriesReport {
		return new ScheduledCategoriesReport(
			this.scheduledTransactions.filter((item) =>
				item.operation.type.isIncome()
			)
		);
	}

	/**
	 * Returns all items that are expenses (excluding transfers)
	 */
	getExpenseItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter((item) =>
			item.operation.type.isExpense()
		);
	}

	/**
	 * Returns all items that are incomes (excluding transfers)
	 */
	getIncomeItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter((item) =>
			item.operation.type.isIncome()
		);
	}

	/**
	 * Returns all transfer items
	 */
	getTransferItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter((item) =>
			item.operation.type.isTransfer()
		);
	}

	/**
	 * Returns infinite recurrent items
	 */
	getInfiniteRecurrentItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter(
			(item) => item.recurrencePattern.totalOccurrences === -1
		);
	}

	/**
	 * Returns finite recurrent items
	 */
	getFiniteRecurrentItems(): ScheduledTransaction[] {
		return this.scheduledTransactions.filter(
			(item) => item.recurrencePattern.totalOccurrences !== -1
		);
	}

	getTotal(): ReportBalance {
		return this.scheduledTransactions.reduce(
			(total, item) => total.plus(item.realPrice),
			ReportBalance.zero()
		);
	}

	getTotalPerMonth(
		accountTypeLookup?: (id: AccountID) => AccountType
	): ReportBalance {
		const lookup =
			accountTypeLookup ||
			ScheduledCategoriesReport.defaultAccountTypeLookup;
		return this.scheduledTransactions.reduce(
			(total, item) =>
				total.plus(
					item.getPricePerMonthWithAccountTypes(
						lookup(item.originAccounts[0].accountId),
						item.destinationAccounts.length > 0
							? lookup(item.destinationAccounts[0].accountId)
							: undefined
					)
				),
			ReportBalance.zero()
		);
	}

	groupPerCategory(
		categoriesWithSubcategories: GetAllCategoriesWithSubCategoriesUseCaseOutput,
		accountTypeLookup?: (id: AccountID) => AccountType
	): {
		perMonthExpensesPercentage: NumberValueObject;
		perMonthInverseOperationPercentage: NumberValueObject;
		items: ItemsWithCategoryAndSubCategory[];
	} {
		const lookup =
			accountTypeLookup ||
			ScheduledCategoriesReport.defaultAccountTypeLookup;
		const res: ItemsWithCategoryAndSubCategory[] = [];
		const totalExpenses = this.onlyExpenses()
			.getTotalPerMonth(lookup)
			.abs();
		const totalIncomes = this.onlyIncomes().getTotalPerMonth(lookup).abs();
		const expenses = NumberValueObject.zero();
		const inverseOperation = NumberValueObject.zero();
		this.scheduledTransactions
			.filter((item) => !item.operation.type.isTransfer())
			.forEach((item) => {
				const categoryWithSubCategories =
					categoriesWithSubcategories.find(({ category }) =>
						category.id.equalTo(item.category.category.id)
					);
				if (!categoryWithSubCategories) return;
				let r = res.find((r) =>
					r.category.category.id.equalTo(item.category.category.id)
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
				const itemPricePerMonth = item.getPricePerMonthWithAccountTypes(
					lookup(item.originAccounts[0].accountId),
					item.destinationAccounts.length > 0
						? lookup(item.destinationAccounts[0].accountId)
						: undefined
				);
				if (r?.category.percentageOperation !== undefined)
					r.category.percentageOperation =
						r.category.percentageOperation.plus(
							itemPricePerMonth.abs()
						);
				let rS = r?.subCategoriesItems.find(({ subCategory }) =>
					subCategory.subCategory.id.equalTo(
						item.category.subCategory.id
					)
				);
				if (!rS) {
					const subCategory =
						categoryWithSubCategories.subCategories.find((sub) =>
							sub.id.equalTo(item.category.subCategory.id)
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
							itemPricePerMonth.abs()
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
							})
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
					})
				)
				.sort((rA, rB) =>
					rA.category.category.name.compareTo(
						rB.category.category.name
					)
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
			subCategory: SubCategory;
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
