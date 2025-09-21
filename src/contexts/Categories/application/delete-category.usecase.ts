import { ItemsService } from "contexts/Items/application/items.service";
import {
	ISubCategoriesService,
	SubCategoryID,
} from "contexts/Subcategories/domain";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { CategoryID } from "../domain";
import { CategoriesService } from "./categories.service";

export interface CategoryDeletionError {
	hasRelatedTransactions: boolean;
	hasRelatedItems: boolean;
	subcategoriesWithTransactions: Array<{
		id: string;
		name: string;
		transactionCount: number;
	}>;
	subcategoriesWithItems: Array<{
		id: string;
		name: string;
		itemCount: number;
	}>;
}

export class DeleteCategoryUseCase {
	constructor(
		private readonly categoriesService: CategoriesService,
		private readonly transactionsService: TransactionsService,
		private readonly itemsService: ItemsService,
		private readonly subCategoriesService: ISubCategoriesService
	) {}

	async checkCategoryDeletion(
		categoryId: CategoryID
	): Promise<CategoryDeletionError | null> {
		const hasRelatedTransactions =
			await this.transactionsService.hasTransactionsByCategory(
				categoryId
			);
		const hasRelatedItems = await this.itemsService.hasItemsByCategory(
			categoryId
		);

		// Get all subcategories for this category
		const subcategories = await this.subCategoriesService.getAll();
		const categorySubcategories = subcategories.filter((sub) =>
			sub.category.equalTo(categoryId)
		);

		const subcategoriesWithTransactions: Array<{
			id: string;
			name: string;
			transactionCount: number;
		}> = [];
		const subcategoriesWithItems: Array<{
			id: string;
			name: string;
			itemCount: number;
		}> = [];

		// Check each subcategory for related transactions and items
		for (const subcategory of categorySubcategories) {
			const subHasTransactions =
				await this.transactionsService.hasTransactionsBySubCategory(
					subcategory.id
				);
			const subHasItems = await this.itemsService.hasItemsBySubCategory(
				subcategory.id
			);

			if (subHasTransactions) {
				const transactions =
					await this.transactionsService.getBySubCategory(
						subcategory.id
					);
				subcategoriesWithTransactions.push({
					id: subcategory.id.value,
					name: subcategory.name.toString(),
					transactionCount: transactions.length,
				});
			}

			if (subHasItems) {
				const items = await this.itemsService.getBySubCategory(
					subcategory.id
				);
				subcategoriesWithItems.push({
					id: subcategory.id.value,
					name: subcategory.name.toString(),
					itemCount: items.length,
				});
			}
		}

		// If there are any related transactions or items, return the error details
		if (
			hasRelatedTransactions ||
			hasRelatedItems ||
			subcategoriesWithTransactions.length > 0 ||
			subcategoriesWithItems.length > 0
		) {
			return {
				hasRelatedTransactions,
				hasRelatedItems,
				subcategoriesWithTransactions,
				subcategoriesWithItems,
			};
		}

		return null;
	}

	async execute(
		categoryId: CategoryID,
		reassignToCategoryId?: CategoryID,
		reassignToSubcategoryId?: SubCategoryID
	): Promise<void> {
		// If no reassignment category is provided, we need to check if there are related transactions/items
		if (!reassignToCategoryId) {
			const deletionError = await this.checkCategoryDeletion(categoryId);

			if (deletionError) {
				const errorMessages: string[] = [];

				if (deletionError.hasRelatedTransactions) {
					errorMessages.push(
						"This category has related transactions"
					);
				}

				if (deletionError.hasRelatedItems) {
					errorMessages.push(
						"This category has related scheduled items"
					);
				}

				if (deletionError.subcategoriesWithTransactions.length > 0) {
					const subcatNames =
						deletionError.subcategoriesWithTransactions
							.map(
								(sub) =>
									`"${sub.name}" (${sub.transactionCount} transactions)`
							)
							.join(", ");
					errorMessages.push(
						`Subcategories with transactions: ${subcatNames}`
					);
				}

				if (deletionError.subcategoriesWithItems.length > 0) {
					const subcatNames = deletionError.subcategoriesWithItems
						.map((sub) => `"${sub.name}" (${sub.itemCount} items)`)
						.join(", ");
					errorMessages.push(
						`Subcategories with scheduled items: ${subcatNames}`
					);
				}

				throw new Error(
					`Cannot delete category with related data. Please provide a category and subcategory to reassign them to.\n\nIssues found:\n${errorMessages.join(
						"\n"
					)}`
				);
			}
		}

		// Reassign related transactions and items if a target category is provided
		if (reassignToCategoryId) {
			if (reassignToSubcategoryId) {
				// Reassign to both category and subcategory
				await this.transactionsService.reassignTransactionsCategoryAndSubcategory(
					categoryId,
					reassignToCategoryId,
					reassignToSubcategoryId
				);
				await this.itemsService.reassignItemsCategoryAndSubcategory(
					categoryId,
					reassignToCategoryId,
					reassignToSubcategoryId
				);
			} else {
				// Reassign only to category
				await this.transactionsService.reassignTransactionsCategory(
					categoryId,
					reassignToCategoryId
				);
				await this.itemsService.reassignItemsCategory(
					categoryId,
					reassignToCategoryId
				);
			}
		}

		// Delete the category
		await this.categoriesService.delete(categoryId);
	}
}
