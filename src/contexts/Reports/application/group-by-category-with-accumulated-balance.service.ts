import { Transaction } from "contexts/Transactions/domain";
import { TransactionsReport } from "../domain/transactions-report.entity";
import { PriceValueObject } from "@juandardilag/value-objects";
import { Category, ICategoriesService } from "contexts/Categories/domain";
import {
	ISubCategoriesService,
	SubCategory,
} from "contexts/Subcategories/domain";
import { QueryUseCase } from "contexts/Shared/domain";

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

export class GroupByCategoryWithAccumulatedBalanceUseCase
	implements QueryUseCase<TransactionsReport, GroupByCategoryWithBalance>
{
	constructor(
		private readonly _categoriesService: ICategoriesService,
		private readonly _subcategoriesService: ISubCategoriesService
	) {}

	async execute(
		report: TransactionsReport
	): Promise<GroupByCategoryWithBalance> {
		const result: GroupByCategoryWithBalance = {};

		for (const transaction of report.transactions) {
			result[transaction.category.value] ??= {
				category: await this._categoriesService.getByID(
					transaction.category
				),
				balance: PriceValueObject.zero(),
				subCategories: {},
			};

			result[transaction.category.value].subCategories[
				transaction.subCategory.value
			] ??= {
				subcategory: await this._subcategoriesService.getByID(
					transaction.subCategory
				),
				balance: PriceValueObject.zero(),
				transactions: [],
			};

			result[transaction.category.value].subCategories[
				transaction.subCategory.value
			].transactions.push(transaction);

			result[transaction.category.value].balance = result[
				transaction.category.value
			].balance.plus(transaction.realAmount);

			result[transaction.category.value].subCategories[
				transaction.subCategory.value
			].balance = result[transaction.category.value].subCategories[
				transaction.subCategory.value
			].balance.plus(transaction.realAmount);
		}

		return result;
	}
}
