import { RecurrentItem } from "contexts/Items";
import { ItemsReport } from "./items-report.entity";
import { ReportBalance } from "./report-balance.valueobject";
import { Account } from "contexts/Accounts";
import { Logger } from "contexts/Shared";
import {
	Category,
	GetAllCategoriesWithSubCategoriesUseCaseOutput,
} from "contexts/Categories";
import { SubCategory } from "contexts/Subcategories";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";

export type RecurrentItemWithAccumulatedBalance = {
	item: RecurrentItem;
	balance: ReportBalance;
	prevBalance: ReportBalance;
};

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
			item: RecurrentItem;
			percentageOperation: NumberValueObject;
			percentageInverseOperation: NumberValueObject;
		}[];
	}[];
};

export class RecurrentItemsReport extends ItemsReport {
	#logger = new Logger("RecurrentItemsReport").off();
	constructor(private _items: RecurrentItem[]) {
		super();
	}

	sortedByDate(direction: "asc" | "desc" = "asc"): RecurrentItemsReport {
		return new RecurrentItemsReport(
			this._items.sort((a, b) =>
				direction === "asc"
					? a.nextDate.compare(b.nextDate)
					: b.nextDate.compare(a.nextDate)
			)
		);
	}

	onlyExpenses(): RecurrentItem[] {
		return this._items.filter((item) => item.operation.isExpense());
	}

	onlyIncomes(): RecurrentItem[] {
		return this._items.filter((item) => item.operation.isIncome());
	}

	getTotal(): ReportBalance {
		return this._items.reduce(
			(total, item) => total.plus(item.realPrice),
			ReportBalance.zero()
		);
	}

	getTotalPerMonth(): ReportBalance {
		return this._items.reduce(
			(total, item) => total.plus(item.pricePerMonth),
			ReportBalance.zero()
		);
	}

	withAccumulatedBalance(
		accounts: Account[]
	): RecurrentItemWithAccumulatedBalance[] {
		if (!this._items.length) return [];

		const sortedReport = this.sortedByDate("asc");

		let accumulated: Record<string, ReportBalance> = {};
		return sortedReport._items
			.map((item) => {
				const itemsWithBalance: RecurrentItemWithAccumulatedBalance[] =
					[];
				if (!accumulated[item.account.value])
					accumulated[item.account.value] =
						accounts.find((acc) => acc.id.equalTo(item.account))
							?.balance ?? ReportBalance.zero();
				const prevBalance = accumulated[item.account.value];
				accumulated[item.account.value] = accumulated[
					item.account.value
				].plus(item.getRealPriceForAccount(item.account));
				this.#logger.debug(
					"accumulating transaction",
					{
						transaction: item.toPrimitives(),
						realAmount: item
							.getRealPriceForAccount(item.account)
							.valueOf(),
						accumulated,
					},
					{ on: false }
				);
				itemsWithBalance.push({
					item,
					balance: accumulated[item.account.value],
					prevBalance,
				});
				if (item.operation.isTransfer() && item.toAccount) {
					if (!accumulated[item.toAccount.value])
						accumulated[item.toAccount.value] =
							accounts.find((acc) => acc.id.equalTo(item.account))
								?.balance ?? ReportBalance.zero();
					const prevBalance = accumulated[item.toAccount.value];
					accumulated[item.toAccount.value] = accumulated[
						item.toAccount.value
					].plus(item.getRealPriceForAccount(item.toAccount));
					itemsWithBalance.push({
						item: item.copyWithNegativeAmount(),
						balance: accumulated[item.toAccount.value],
						prevBalance,
					});
				}
				return itemsWithBalance;
			})
			.flat();
	}

	groupPerCategory(
		categoriesWithSubcategories: GetAllCategoriesWithSubCategoriesUseCaseOutput
	): ItemsWithCategoryAndSubCategory[] {
		const res: ItemsWithCategoryAndSubCategory[] = [];
		const items = this.onlyExpenses();
		const totalExpenses = new RecurrentItemsReport(items)
			.getTotalPerMonth()
			.abs();
		const totalIncomes = new RecurrentItemsReport(this.onlyIncomes())
			.getTotalPerMonth()
			.abs();
		items.forEach((item) => {
			const categoryWithSubCategories = categoriesWithSubcategories.find(
				({ category }) => category.id.equalTo(item.category)
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
						percentageInverseOperation: NumberValueObject.zero(),
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
						percentageInverseOperation: NumberValueObject.zero(),
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
					.toFixed(2),
				percentageInverseOperation: item.pricePerMonth
					.abs()
					.divide(totalIncomes)
					.times(new NumberValueObject(100))
					.toFixed(2),
			});
		});
		return res
			.map(
				({
					subCategoriesItems,
					category: { category, percentageOperation },
				}) => ({
					subCategoriesItems: subCategoriesItems.map(
						({
							items,
							subCategory: { percentageOperation, subCategory },
						}) => ({
							subCategory: {
								percentageOperation: percentageOperation
									.divide(totalExpenses)
									.times(new NumberValueObject(100))
									.toFixed(2),
								percentageInverseOperation: percentageOperation
									.divide(totalIncomes)
									.times(new NumberValueObject(100))
									.toFixed(2),
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
							.toFixed(2),
						percentageInverseOperation: percentageOperation
							.divide(totalIncomes)
							.times(new NumberValueObject(100))
							.toFixed(2),
					},
				})
			)
			.sort((rA, rB) =>
				rA.category.category.name.compare(rB.category.category.name)
			);
	}
}
