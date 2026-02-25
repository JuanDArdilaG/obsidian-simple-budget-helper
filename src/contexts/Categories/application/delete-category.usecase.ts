import { ISubCategoriesService } from "contexts/Subcategories/domain";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { ScheduledTransactionsService } from "../../ScheduledTransactions/application/scheduled-transactions.service";
import { Nanoid } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
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
	readonly #logger = new Logger("DeleteCategoryUseCase");
	constructor(
		private readonly categoriesService: CategoriesService,
		private readonly transactionsService: TransactionsService,
		private readonly _scheduledTransactionsService: ScheduledTransactionsService,
		private readonly subCategoriesService: ISubCategoriesService,
	) {}

	async checkCategoryDeletion(
		categoryId: Nanoid,
	): Promise<CategoryDeletionError | null> {
		this.#logger.debug("checking category deletion", { categoryId });
		const hasRelatedTransactions =
			await this.transactionsService.hasTransactionsByCategory(
				categoryId,
			);
		this.#logger.debug("related transactions", { hasRelatedTransactions });
		const hasRelatedScheduledTransactions =
			await this._scheduledTransactionsService.hasItemsByCategory(
				categoryId,
			);
		this.#logger.debug("related scheduled items", {
			hasRelatedScheduledTransactions,
		});

		// Get all subcategories for this category
		const subcategories = await this.subCategoriesService.getAll();
		this.#logger.debug("fetched subcategories", { subcategories });
		const categorySubcategories = subcategories.filter((sub) =>
			sub.categoryId.equalTo(categoryId),
		);
		this.#logger.debug("category subcategories", { categorySubcategories });

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
					new Nanoid(subcategory.id),
				);
			this.#logger.debug("subcategory transactions check", {
				subcategoryId: subcategory.id,
				subHasTransactions,
			});
			const subHasScheduledTransactions =
				await this._scheduledTransactionsService.hasItemsBySubCategory(
					new Nanoid(subcategory.id),
				);
			this.#logger.debug("subcategory items check", {
				subcategoryId: subcategory.id,
				subHasScheduledTransactions,
			});
			if (subHasTransactions) {
				const transactions =
					await this.transactionsService.getBySubCategory(
						new Nanoid(subcategory.id),
					);
				subcategoriesWithTransactions.push({
					id: subcategory.id,
					name: subcategory.name.toString(),
					transactionCount: transactions.length,
				});
			}

			if (subHasScheduledTransactions) {
				const items =
					await this._scheduledTransactionsService.getBySubCategory(
						new Nanoid(subcategory.id),
					);
				subcategoriesWithItems.push({
					id: subcategory.id,
					name: subcategory.name.toString(),
					itemCount: items.length,
				});
			}
		}

		this.#logger.debug("subcategory issues", {
			subcategoriesWithTransactions,
			subcategoriesWithItems,
		});

		// If there are any related transactions or items, return the error details
		if (
			hasRelatedTransactions ||
			hasRelatedScheduledTransactions ||
			subcategoriesWithTransactions.length > 0 ||
			subcategoriesWithItems.length > 0
		) {
			return {
				hasRelatedTransactions,
				hasRelatedItems: hasRelatedScheduledTransactions,
				subcategoriesWithTransactions,
				subcategoriesWithItems,
			};
		}

		return null;
	}

	async execute(
		categoryId: Nanoid,
		reassignToCategoryId?: Nanoid,
		reassignToSubcategoryId?: Nanoid,
	): Promise<void> {
		// If no reassignment category is provided, we need to check if there are related transactions/items
		if (!reassignToCategoryId) {
			const deletionError = await this.checkCategoryDeletion(categoryId);

			if (deletionError) {
				const errorMessages: string[] = [];

				if (deletionError.hasRelatedTransactions) {
					errorMessages.push(
						"This category has related transactions",
					);
				}

				if (deletionError.hasRelatedItems) {
					errorMessages.push(
						"This category has related scheduled items",
					);
				}

				if (deletionError.subcategoriesWithTransactions.length > 0) {
					const subcatNames =
						deletionError.subcategoriesWithTransactions
							.map(
								(sub) =>
									`"${sub.name}" (${sub.transactionCount} transactions)`,
							)
							.join(", ");
					errorMessages.push(
						`Subcategories with transactions: ${subcatNames}`,
					);
				}

				if (deletionError.subcategoriesWithItems.length > 0) {
					const subCategoryNames =
						deletionError.subcategoriesWithItems
							.map(
								(sub) =>
									`"${sub.name}" (${sub.itemCount} items)`,
							)
							.join(", ");
					errorMessages.push(
						`Subcategories with scheduled items: ${subCategoryNames}`,
					);
				}

				throw new Error(
					`Cannot delete category with related data. Please provide a category and subcategory to reassign them to.\n\nIssues found:\n${errorMessages.join(
						"\n",
					)}`,
				);
			}
		}

		// Reassign related transactions and items if a target category is provided
		if (reassignToCategoryId) {
			const category = await this.categoriesService.getByID(
				categoryId.value,
			);
			const categoryTo = await this.categoriesService.getByID(
				reassignToCategoryId.value,
			);
			if (reassignToSubcategoryId) {
				// Reassign to both category and subcategory
				await this.transactionsService.reassignTransactionsCategoryAndSubcategory(
					categoryId,
					reassignToCategoryId,
					reassignToSubcategoryId,
				);

				const subcategoryTo = await this.subCategoriesService.getByID(
					reassignToSubcategoryId.value,
				);

				await this._scheduledTransactionsService.reassignItemsCategoryAndSubcategory(
					categoryId,
					undefined,
					categoryTo,
					subcategoryTo,
				);
			} else {
				// Reassign only to category
				await this.transactionsService.reassignTransactionsCategory(
					category,
					categoryTo,
				);

				await this._scheduledTransactionsService.reassignItemsCategory(
					category,
					categoryTo,
				);
			}
		}

		// Delete the category
		await this.categoriesService.delete(categoryId.value);
	}
}
