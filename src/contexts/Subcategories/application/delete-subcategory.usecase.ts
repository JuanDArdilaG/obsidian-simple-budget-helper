import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { ICategoriesService } from "../../Categories/domain";
import { ScheduledTransactionsService } from "../../ScheduledTransactions/application/scheduled-transactions.service";
import { Nanoid } from "../../Shared/domain";
import { ISubCategoriesService } from "../domain";

export class DeleteSubCategoryUseCase {
	constructor(
		private readonly categoriesService: ICategoriesService,
		private readonly subCategoriesService: ISubCategoriesService,
		private readonly transactionsService: TransactionsService,
		private readonly _scheduledTransactionsService: ScheduledTransactionsService,
	) {}

	async execute(
		categoryId: Nanoid,
		subCategoryId: Nanoid,
		newCategoryId?: Nanoid,
		newSubcategoryId?: Nanoid,
	): Promise<void> {
		// If no reassignment subcategory is provided, we need to check if there are related transactions/items
		if (!newSubcategoryId || !newCategoryId) {
			const hasRelatedTransactions =
				await this.transactionsService.hasTransactionsBySubCategory(
					subCategoryId,
				);
			const hasRelatedItems =
				await this._scheduledTransactionsService.hasItemsBySubCategory(
					subCategoryId,
				);

			if (hasRelatedTransactions || hasRelatedItems) {
				throw new Error(
					"Cannot delete subcategory with related transactions or items. Please provide a subcategory to reassign them to.",
				);
			}
		}

		// Reassign related transactions and items if a target subcategory is provided
		if (newSubcategoryId && newCategoryId) {
			await this.transactionsService.reassignTransactionsCategoryAndSubcategory(
				categoryId,
				newCategoryId,
				newSubcategoryId,
			);

			const categoryTo = await this.categoriesService.getByID(
				newCategoryId.value,
			);
			const subCategory = await this.subCategoriesService.getByID(
				subCategoryId.value,
			);
			const subCategoryTo = await this.subCategoriesService.getByID(
				newSubcategoryId.value,
			);

			await this._scheduledTransactionsService.reassignItemsCategoryAndSubcategory(
				categoryId,
				subCategory.nanoid,
				categoryTo,
				subCategoryTo,
			);
		}

		// Delete the subcategory
		await this.subCategoriesService.delete(subCategoryId.value);
	}
}
