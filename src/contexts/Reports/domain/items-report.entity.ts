import { Category } from "contexts/Categories/domain";
import { Item } from "contexts/Items/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { SubCategory } from "contexts/Subcategories/domain";
import { ReportBalance } from "./report-balance.valueobject";
import { NumberValueObject } from "@juandardilag/value-objects";
import { GetAllCategoriesWithSubCategoriesUseCaseOutput } from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";

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

	getTotalPerMonth(): ReportBalance {
		return this.items.reduce(
			(total, item) => total.plus(item.pricePerMonth),
			ReportBalance.zero()
		);
	}

	groupPerCategory(
		categoriesWithSubcategories: GetAllCategoriesWithSubCategoriesUseCaseOutput
	): {
		perMonthExpensesPercentage: NumberValueObject;
		perMonthInverseOperationPercentage: NumberValueObject;
		items: ItemsWithCategoryAndSubCategory[];
	} {
		const res: ItemsWithCategoryAndSubCategory[] = [];
		const totalExpenses = this.onlyExpenses().getTotalPerMonth().abs();
		const totalIncomes = this.onlyIncomes().getTotalPerMonth().abs();
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
				if (r?.category.percentageOperation !== undefined)
					r.category.percentageOperation =
						r.category.percentageOperation.plus(
							item.pricePerMonth.abs()
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
							item.pricePerMonth.abs()
						);
				rS?.items.push({
					item,
					percentageOperation: item.pricePerMonth
						.abs()
						.divide(totalExpenses)
						.times(new NumberValueObject(100))
						.fixed(2),
					percentageInverseOperation: item.pricePerMonth
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
