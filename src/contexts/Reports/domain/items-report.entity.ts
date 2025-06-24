import { NumberValueObject } from "@juandardilag/value-objects";
import { AccountID, AccountType } from "contexts/Accounts/domain";
import { GetAllCategoriesWithSubCategoriesUseCaseOutput } from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { Category } from "contexts/Categories/domain";
import { Item } from "contexts/Items/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { SubCategory } from "contexts/Subcategories/domain";
import { ReportBalance } from "./report-balance.valueobject";

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
			item: Item;
			percentageOperation: NumberValueObject;
			percentageInverseOperation: NumberValueObject;
		}[];
	}[];
};

export class ItemsReport {
	readonly _ = new Logger("ItemsReport");
	private static defaultAccountTypeLookup = () => {
		return new AccountType("asset");
	};
	constructor(readonly items: Item[]) {}

	onlyExpenses(): ItemsReport {
		return new ItemsReport(
			this.items.filter((item) => item.operation.type.isExpense())
		);
	}

	onlyIncomes(): ItemsReport {
		return new ItemsReport(
			this.items.filter((item) => item.operation.type.isIncome())
		);
	}

	onlyInfiniteRecurrent(): ItemsReport {
		return new ItemsReport(
			this.items.filter(
				(item) => item.recurrence?.totalRecurrences === -1
			)
		);
	}

	onlyFiniteRecurrent(): ItemsReport {
		return new ItemsReport(
			this.items.filter(
				(item) => item.recurrence?.totalRecurrences !== -1
			)
		);
	}

	/**
	 * Returns all items that are expenses (excluding transfers)
	 */
	getExpenseItems(): Item[] {
		return this.items.filter((item) => item.operation.type.isExpense());
	}

	/**
	 * Returns all items that are incomes (excluding transfers)
	 */
	getIncomeItems(): Item[] {
		return this.items.filter((item) => item.operation.type.isIncome());
	}

	/**
	 * Returns all transfer items
	 */
	getTransferItems(): Item[] {
		return this.items.filter((item) => item.operation.type.isTransfer());
	}

	/**
	 * Returns infinite recurrent items
	 */
	getInfiniteRecurrentItems(): Item[] {
		return this.items.filter(
			(item) => item.recurrence?.totalRecurrences === -1
		);
	}

	/**
	 * Returns finite recurrent items
	 */
	getFiniteRecurrentItems(): Item[] {
		return this.items.filter(
			(item) => item.recurrence?.totalRecurrences !== -1
		);
	}

	getYears(): number[] {
		return [
			...new Set(
				this.items
					.map((item) => item.recurrence.recurrences)
					.flat()
					.map((r) => r.date.getFullYear())
			),
		];
	}

	getTotal(): ReportBalance {
		return this.items.reduce(
			(total, item) => total.plus(item.realPrice),
			ReportBalance.zero()
		);
	}

	getTotalPerMonth(
		accountTypeLookup?: (id: AccountID) => AccountType
	): ReportBalance {
		const lookup =
			accountTypeLookup || ItemsReport.defaultAccountTypeLookup;
		return this.items.reduce(
			(total, item) =>
				total.plus(item.getPricePerMonthWithAccountTypes(lookup)),
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
			accountTypeLookup || ItemsReport.defaultAccountTypeLookup;
		const res: ItemsWithCategoryAndSubCategory[] = [];
		const totalExpenses = this.onlyExpenses()
			.getTotalPerMonth(lookup)
			.abs();
		const totalIncomes = this.onlyIncomes().getTotalPerMonth(lookup).abs();
		const expenses = NumberValueObject.zero();
		const inverseOperation = NumberValueObject.zero();
		this.items
			.filter((item) => !item.operation.type.isTransfer())
			.forEach((item) => {
				const categoryWithSubCategories =
					categoriesWithSubcategories.find(({ category }) =>
						category.id.equalTo(item.category)
					);
				if (!categoryWithSubCategories) return;
				let r = res.find((r) =>
					r.category.category.id.equalTo(item.category)
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
				const itemPricePerMonth =
					item.getPricePerMonthWithAccountTypes(lookup);
				if (r?.category.percentageOperation !== undefined)
					r.category.percentageOperation =
						r.category.percentageOperation.plus(
							itemPricePerMonth.abs()
						);
				let rS = r?.subCategoriesItems.find(({ subCategory }) =>
					subCategory.subCategory.id.equalTo(item.subCategory)
				);
				if (!rS) {
					const subCategory =
						categoryWithSubCategories.subCategories.find((sub) =>
							sub.id.equalTo(item.subCategory)
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
