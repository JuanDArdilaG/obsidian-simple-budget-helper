import { PriceValueObject } from "@juandardilag/value-objects";
import { Category, ICategoriesService } from "contexts/Categories/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import {
	ISubCategoriesService,
	SubCategory,
} from "contexts/Subcategories/domain";
import { Transaction } from "contexts/Transactions/domain";
import { TransactionsReport } from "../domain/transactions-report.entity";

export type GroupBySubcategoryWithBalance = {
	[subcategoryID: string]: {
		subcategory: SubCategory;
		balance: PriceValueObject;
		transactions: Transaction[];
	};
};

export type GroupByCategoryWithBalance = {
	[categoryID: string]: {
		category: Category;
		balance: PriceValueObject;
		subCategories: GroupBySubcategoryWithBalance;
	};
};

export class GroupByCategoryWithAccumulatedBalanceUseCase implements QueryUseCase<
	TransactionsReport,
	GroupByCategoryWithBalance
> {
	constructor(
		private readonly categoriesService: ICategoriesService,
		private readonly subCategoriesService: ISubCategoriesService,
	) {}

	async execute(
		report: TransactionsReport,
	): Promise<GroupByCategoryWithBalance> {
		const result: GroupByCategoryWithBalance = {};

		for (const transaction of report.transactions) {
			result[transaction.category.id.value] ??= {
				category: transaction.category,
				balance: PriceValueObject.zero(),
				subCategories: {},
			};

			result[transaction.category.id.value].subCategories[
				transaction.subcategory.id.value
			] ??= {
				subcategory: transaction.subcategory,
				balance: PriceValueObject.zero(),
				transactions: [],
			};

			result[transaction.category.id.value].subCategories[
				transaction.subcategory.id.value
			].transactions.push(transaction);

			if (transaction.operation.isExpense()) {
				result[transaction.category.id.value].balance = result[
					transaction.category.id.value
				].balance.plus(transaction.originAmount.negate());

				result[transaction.category.id.value].subCategories[
					transaction.subcategory.id.value
				].balance = result[transaction.category.id.value].subCategories[
					transaction.subcategory.id.value
				].balance.plus(transaction.originAmount.negate());
			} else {
				result[transaction.category.id.value].balance = result[
					transaction.category.id.value
				].balance.plus(transaction.originAmount);

				result[transaction.category.id.value].subCategories[
					transaction.subcategory.id.value
				].balance = result[transaction.category.id.value].subCategories[
					transaction.subcategory.id.value
				].balance.plus(transaction.originAmount);
			}
		}

		return result;
	}
}
