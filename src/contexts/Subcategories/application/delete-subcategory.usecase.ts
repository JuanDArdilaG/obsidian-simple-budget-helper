import { ItemsService } from "contexts/Items/application/items.service";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { SubCategoryID } from "../domain";
import { SubCategoriesService } from "./subcategories.service";

export class DeleteSubCategoryUseCase {
	constructor(
		private readonly subCategoriesService: SubCategoriesService,
		private readonly transactionsService: TransactionsService,
		private readonly itemsService: ItemsService
	) {}

	async execute(
		subCategoryId: SubCategoryID,
		reassignToSubCategoryId?: SubCategoryID
	): Promise<void> {
		// If no reassignment subcategory is provided, we need to check if there are related transactions/items
		if (!reassignToSubCategoryId) {
			const hasRelatedTransactions =
				await this.transactionsService.hasTransactionsBySubCategory(
					subCategoryId
				);
			const hasRelatedItems =
				await this.itemsService.hasItemsBySubCategory(subCategoryId);

			if (hasRelatedTransactions || hasRelatedItems) {
				throw new Error(
					"Cannot delete subcategory with related transactions or items. Please provide a subcategory to reassign them to."
				);
			}
		}

		// Reassign related transactions and items if a target subcategory is provided
		if (reassignToSubCategoryId) {
			await this.transactionsService.reassignTransactionsSubCategory(
				subCategoryId,
				reassignToSubCategoryId
			);
			await this.itemsService.reassignItemsSubCategory(
				subCategoryId,
				reassignToSubCategoryId
			);
		}

		// Delete the subcategory
		await this.subCategoriesService.delete(subCategoryId);
	}
}
