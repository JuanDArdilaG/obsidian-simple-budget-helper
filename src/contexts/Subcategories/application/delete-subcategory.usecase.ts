import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { ScheduledTransactionsService } from "../../ScheduledTransactions/application/scheduled-transactions.service";
import { SubCategoryID } from "../domain";
import { SubCategoriesService } from "./subcategories.service";

export class DeleteSubCategoryUseCase {
	constructor(
		private readonly subCategoriesService: SubCategoriesService,
		private readonly transactionsService: TransactionsService,
		private readonly itemsService: ScheduledTransactionsService
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
			const subCategory = await this.subCategoriesService.getByID(
				subCategoryId
			);
			const subCategoryTo = await this.subCategoriesService.getByID(
				reassignToSubCategoryId
			);
			await this.itemsService.reassignItemsSubCategory(
				subCategory,
				subCategoryTo
			);
		}

		// Delete the subcategory
		await this.subCategoriesService.delete(subCategoryId);
	}
}
