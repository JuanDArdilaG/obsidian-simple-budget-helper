import { Account, AccountID } from "contexts/Accounts/domain";
import { GetAllCategoriesWithSubCategoriesUseCaseOutput } from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { Category } from "contexts/Categories/domain";
import { Item } from "contexts/Items/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { SubCategory } from "contexts/Subcategories/domain";
import { ReportBalance } from "./report-balance.valueobject";
import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { ItemOperation } from "contexts/Shared/domain";

export type ItemWithAccumulatedBalance = {
	item: Item;
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
			item: Item;
			percentageOperation: NumberValueObject;
			percentageInverseOperation: NumberValueObject;
		}[];
	}[];
};

export class ItemsReport {
	readonly #logger = new Logger("ItemsReport");
	constructor(readonly items: Item[]) {}

	sortedByDate(direction: "asc" | "desc" = "asc"): ItemsReport {
		return new ItemsReport(
			this.items.toSorted((a, b) =>
				direction === "asc"
					? a.date.compare(b.date)
					: b.date.compare(a.date)
			)
		);
	}

	onlyExpenses(): ItemsReport {
		return new ItemsReport(
			this.items.filter((item) => item.operation.isExpense())
		);
	}

	onlyIncomes(): ItemsReport {
		return new ItemsReport(
			this.items.filter((item) => item.operation.isIncome())
		);
	}

	untilDate(date: DateValueObject): ItemsReport {
		return new ItemsReport(
			this.items.filter((item) => item.date.isLessOrEqualThan(date))
		);
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

	withAccumulatedBalance(accounts: Account[]): ItemWithAccumulatedBalance[] {
		this.#logger.debug("withAccumulatedBalance", { accounts });
		if (!this.items.length) return [];

		let accumulated: Record<string, ReportBalance> = {};
		return this.sortedByDate("asc")
			.items.map((item) => ({
				item,
				account: accounts.find((acc) => acc.id.equalTo(item.account)),
			}))
			.map(({ item, account }) => {
				if (!account)
					return {
						item,
						balance: ReportBalance.zero(),
						prevBalance: ReportBalance.zero(),
					};
				const itemsWithBalance: ItemWithAccumulatedBalance[] = [];
				if (!accumulated[item.account.value])
					accumulated[item.account.value] =
						account?.balance.value ?? ReportBalance.zero();

				const prevBalance = accumulated[item.account.value];
				accumulated[item.account.value] = accumulated[
					item.account.value
				].plus(item.getRealPriceForAccount(account));

				const toAccount = item.toAccount
					? accounts.find((acc) =>
							acc.id.equalTo(item.toAccount ?? new AccountID(""))
					  )
					: undefined;
				if (item.operation.isTransfer() && toAccount) {
					const expenseTransaction = item.copy();
					expenseTransaction.updateOperation(ItemOperation.expense());

					itemsWithBalance.push({
						item: expenseTransaction,
						balance: accumulated[item.account.value],
						prevBalance,
					});
				} else {
					itemsWithBalance.push({
						item,
						balance: accumulated[item.account.value],
						prevBalance,
					});
				}

				this.#logger.debug("item", {
					item,
					operation: item.operation,
				});
				if (item.operation.isTransfer() && toAccount) {
					this.#logger.debug("transfer item", { item });
					if (!accumulated[toAccount.id.value])
						accumulated[toAccount.id.value] =
							toAccount.balance.value;

					const prevBalance = accumulated[toAccount.id.value];
					accumulated[toAccount.id.value] = accumulated[
						toAccount.id.value
					].plus(item.getRealPriceForAccount(toAccount));

					const incomeTransaction = item.copy();
					incomeTransaction.updateOperation(ItemOperation.income());
					incomeTransaction.updateAccount(toAccount.id);
					itemsWithBalance.push({
						item: incomeTransaction,
						balance: accumulated[toAccount.id.value],
						prevBalance,
					});
				}
				return itemsWithBalance;
			})
			.flat();
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
		let expenses = NumberValueObject.zero();
		let inverseOperation = NumberValueObject.zero();
		this.items
			.filter((item) => !item.operation.isTransfer())
			.forEach((item) => {
				if (item.category.value === "wqL5sFi3s_bJV_Gl8sngb") {
					this.#logger.debug("loan item", { item });
				}
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
