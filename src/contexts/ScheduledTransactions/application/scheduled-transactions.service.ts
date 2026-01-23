import { NumberValueObject } from "@juandardilag/value-objects";
import { Category, CategoryID } from "contexts/Categories/domain";
import { Service } from "contexts/Shared/application/service.abstract";
import { SubCategory, SubCategoryID } from "contexts/Subcategories/domain";
import { IAccountsService } from "../../Accounts/domain";
import { Nanoid } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsRepository,
	IScheduledTransactionsService,
	ItemRecurrenceInfo,
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "../domain";

export class ScheduledTransactionsService
	extends Service<
		Nanoid,
		ScheduledTransaction,
		ScheduledTransactionPrimitives
	>
	implements IScheduledTransactionsService
{
	static readonly #logger = new Logger("ScheduledTransactionsService");
	constructor(
		private readonly _scheduledTransactionsRepository: IScheduledTransactionsRepository,
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService,
		private readonly _accountsService: IAccountsService,
	) {
		super("ScheduledTransaction", _scheduledTransactionsRepository);
	}

	async delete(id: Nanoid): Promise<void> {
		ScheduledTransactionsService.#logger.debug(
			`Deleting scheduled transaction with id ${id}`,
		);
		const modifications =
			await this._recurrenceModificationsService.getByScheduledItemId(id);
		ScheduledTransactionsService.#logger.debug(
			`Found ${modifications.length} modifications for scheduled transaction with id ${id}`,
		);
		for (const modification of modifications) {
			await this._recurrenceModificationsService.delete(modification.id);
		}
		super.delete(id);
	}

	async getByCategory(category: CategoryID): Promise<ScheduledTransaction[]> {
		return await this._scheduledTransactionsRepository.findByCategory(
			category,
		);
	}

	async getBySubCategory(
		subCategory: SubCategoryID,
	): Promise<ScheduledTransaction[]> {
		return await this._scheduledTransactionsRepository.findBySubCategory(
			subCategory,
		);
	}

	async hasItemsByCategory(category: CategoryID): Promise<boolean> {
		const items = await this.getByCategory(category);
		return items.length > 0;
	}

	async hasItemsBySubCategory(subCategory: SubCategoryID): Promise<boolean> {
		const items = await this.getBySubCategory(subCategory);
		return items.length > 0;
	}

	async reassignItemsCategory(
		oldCategory: Category,
		newCategory: Category,
	): Promise<void> {
		const items = await this.getByCategory(oldCategory.id);
		for (const item of items) {
			item.category.category = newCategory;
			await this._scheduledTransactionsRepository.persist(item);
		}
	}

	async reassignItemsSubCategory(
		oldSubCategory: SubCategory,
		newSubCategory: SubCategory,
	): Promise<void> {
		const items = await this.getBySubCategory(oldSubCategory.id);
		for (const item of items) {
			item.category.subCategory = newSubCategory;
			await this._scheduledTransactionsRepository.persist(item);
		}
	}

	async reassignItemsCategoryAndSubcategory(
		oldCategory: Category,
		newCategory: Category,
		newSubCategory: SubCategory,
	): Promise<void> {
		const items = await this.getByCategory(oldCategory.id);
		for (const item of items) {
			item.category.category = newCategory;
			item.category.subCategory = newSubCategory;
			await this._scheduledTransactionsRepository.persist(item);
		}
	}

	async getOccurrence(
		id: Nanoid,
		occurrenceIndex: NumberValueObject,
	): Promise<ItemRecurrenceInfo | null> {
		const scheduledTransaction = await this.getByID(id);
		const baseDate =
			scheduledTransaction.getOccurrenceDate(occurrenceIndex);

		if (!baseDate) {
			return null;
		}

		const modification =
			await this._recurrenceModificationsService.getByScheduledItemIdAndOccurrenceIndex(
				id,
				occurrenceIndex.value,
			);

		if (modification) {
			return ItemRecurrenceInfo.fromModification(
				scheduledTransaction,
				modification,
			);
		}

		return ItemRecurrenceInfo.fromScheduledTransaction(
			scheduledTransaction,
			occurrenceIndex,
			baseDate,
		);
	}

	async getMonthlyPriceEstimate(id: Nanoid): Promise<NumberValueObject> {
		const scheduledTransaction = await this.getByID(id);
		const fromAccount = scheduledTransaction.originAccounts[0].account;
		const toAccount =
			scheduledTransaction.destinationAccounts.length > 0
				? scheduledTransaction.destinationAccounts[0].account
				: null;
		if (toAccount?.type.equalTo(fromAccount.type)) {
			return new NumberValueObject(0);
		}
		const frequencyFactor =
			scheduledTransaction.getMonthlyFrequencyFactor();

		const absValue = new NumberValueObject(
			scheduledTransaction.originAmount.value * frequencyFactor.value,
		);
		if (
			toAccount?.type.isLiability() ||
			scheduledTransaction.operation.type.isExpense()
		) {
			return absValue.times(new NumberValueObject(-1));
		}
		return absValue;
	}
}
