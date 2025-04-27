import { Account, AccountBalance } from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import { Item } from "contexts/Items/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { SubCategory } from "contexts/Subcategories/domain";
import { ReportBalance } from "./report-balance.valueobject";
import { NumberValueObject } from "@juandardilag/value-objects";
import { GetAllCategoriesWithSubCategoriesUseCaseOutput } from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";

export type ItemWithAccumulatedBalance = {
	item: Item;
	accountPrevBalance: AccountBalance;
	accountBalance: AccountBalance;
	toAccountPrevBalance?: AccountBalance;
	toAccountBalance?: AccountBalance;
};

export type ItemWithAccounts = {
	item: Item;
	account: Account;
	toAccount?: Account;
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

	preValidate(): boolean {
		this.#logger.debug("preValidate", {
			length: this.items.length,
		});
		return this.items.length > 0;
	}

	sort(): void {
		this.items.sort((a, b) => a.date.compare(b.date));
		this.#logger.debug("sort", {
			items: [...this.items],
		});
	}

	filter(): void {}

	addAccounts(accounts: Account[]): ItemWithAccounts[] {
		return this.items
			.filter((item) => {
				this.#logger.debug("addAccounts", {
					item,
					account: accounts.find((acc) =>
						acc.id.equalTo(item.account)
					),
				});
				return accounts.find((acc) => acc.id.equalTo(item.account));
			})
			.map((item) => ({
				item,
				account: accounts.find((acc) => acc.id.equalTo(item.account))!,
				toAccount:
					item.toAccount &&
					accounts.find((acc) => acc.id.equalTo(item.toAccount!)),
			}));
	}

	initialAccountsBalance(
		itemsWithAccount: ItemWithAccounts[]
	): Record<string, AccountBalance> {
		const result: Record<string, AccountBalance> = {};
		itemsWithAccount.forEach(({ account, toAccount }) => {
			result[account.id.value] = account.balance;
			if (toAccount) result[toAccount.id.value] = toAccount.balance;
		});
		this.#logger.debug("initialAccountsBalance", {
			result,
		});
		return result;
	}

	addItemToAccountBalance(
		itemWithAccount: ItemWithAccounts,
		accountBalance: AccountBalance,
		toAccountBalance?: AccountBalance
	): {
		newAccountBalance: AccountBalance;
		newToAccountBalance?: AccountBalance;
	} {
		accountBalance = accountBalance.plus(
			itemWithAccount.item.getRealPriceForAccount(itemWithAccount.account)
		);

		if (toAccountBalance && itemWithAccount.toAccount)
			toAccountBalance = toAccountBalance.plus(
				itemWithAccount.item.getRealPriceForAccount(
					itemWithAccount.toAccount
				)
			);

		this.#logger.debug("addItemToAccountBalance", {
			itemWithAccount,
			accountBalance,
			toAccountBalance,
		});

		return {
			newAccountBalance: accountBalance,
			newToAccountBalance: toAccountBalance,
		};
	}

	execute(accounts: Account[]): ItemWithAccumulatedBalance[] {
		if (!this.preValidate()) return [];
		this.sort();
		this.filter();
		const itemsWithAccount = this.addAccounts(accounts);
		this.#logger.debug("itemsWithAccount", {
			itemsWithAccount,
		});
		const initialAccountsBalance =
			this.initialAccountsBalance(itemsWithAccount);

		return itemsWithAccount.map(({ item, account, toAccount }) => {
			const accountPrevBalance =
				initialAccountsBalance[item.account.value];
			const toAccountPrevBalance =
				item.toAccount && initialAccountsBalance[item.toAccount.value];

			const { newAccountBalance, newToAccountBalance } =
				this.addItemToAccountBalance(
					{ item, account, toAccount },
					accountPrevBalance,
					toAccountPrevBalance
				);

			initialAccountsBalance[item.account.value] = newAccountBalance;
			if (item.toAccount && newToAccountBalance)
				initialAccountsBalance[item.toAccount.value] =
					newToAccountBalance;

			return {
				item,
				accountPrevBalance,
				accountBalance: newAccountBalance,
				toAccountPrevBalance,
				toAccountBalance: newToAccountBalance,
			};
		});
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
			.filter((item) => !item.operation.isTransfer())
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
