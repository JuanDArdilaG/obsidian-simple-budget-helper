import { NumberValueObject } from "@juandardilag/value-objects";
import { Category } from "contexts/Categories/domain";
import { Service } from "contexts/Shared/application/service.abstract";
import { Subcategory } from "contexts/Subcategories/domain";
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
		string,
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

	async delete(id: string): Promise<void> {
		ScheduledTransactionsService.#logger.debug(
			`Deleting scheduled transaction with id ${id}`,
		);
		const modifications =
			await this._recurrenceModificationsService.getByScheduledItemId(
				new Nanoid(id),
			);
		ScheduledTransactionsService.#logger.debug(
			`Found ${modifications.length} modifications for scheduled transaction with id ${id}`,
		);
		for (const modification of modifications) {
			await this._recurrenceModificationsService.delete(modification.id);
		}
		super.delete(id);
	}

	async getByCategory(category: Nanoid): Promise<ScheduledTransaction[]> {
		return await this._scheduledTransactionsRepository.findByCategory(
			category,
		);
	}

	async getBySubCategory(
		subCategory: Nanoid,
	): Promise<ScheduledTransaction[]> {
		return await this._scheduledTransactionsRepository.findBySubCategory(
			subCategory,
		);
	}

	async hasItemsByCategory(category: Nanoid): Promise<boolean> {
		const items = await this.getByCategory(category);
		return items.length > 0;
	}

	async hasItemsBySubCategory(subCategory: Nanoid): Promise<boolean> {
		const items = await this.getBySubCategory(subCategory);
		return items.length > 0;
	}

	async reassignItemsCategory(
		oldCategory: Category,
		newCategory: Category,
	): Promise<void> {
		const items = await this.getByCategory(oldCategory.nanoid);
		for (const item of items) {
			item.category = newCategory.nanoid;
			await this._scheduledTransactionsRepository.persist(item);
		}
	}

	async reassignItemsSubCategory(
		oldSubCategory: Subcategory,
		newSubCategory: Subcategory,
	): Promise<void> {
		const items = await this.getBySubCategory(oldSubCategory.nanoid);
		for (const item of items) {
			item.subcategory = newSubCategory.nanoid;
			await this._scheduledTransactionsRepository.persist(item);
		}
	}

	async reassignItemsCategoryAndSubcategory(
		oldCategoryId: Nanoid,
		oldSubcategoryId: Nanoid | undefined,
		newCategory: Category,
		newSubCategory: Subcategory,
	): Promise<void> {
		const items = oldSubcategoryId
			? await this.getBySubCategory(oldSubcategoryId)
			: await this.getByCategory(oldCategoryId);
		for (const item of items) {
			item.category = newCategory.nanoid;
			item.subcategory = newSubCategory.nanoid;
			await this._scheduledTransactionsRepository.persist(item);
		}
	}

	async getOccurrence(
		id: Nanoid,
		occurrenceIndex: number,
	): Promise<ItemRecurrenceInfo | null> {
		const scheduledTransaction = await this.getByID(id.value);
		const baseDate =
			scheduledTransaction.getOccurrenceDate(occurrenceIndex);

		if (!baseDate) {
			return null;
		}

		const modification =
			await this._recurrenceModificationsService.getByScheduledItemIdAndOccurrenceIndex(
				id,
				occurrenceIndex,
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
		const scheduledTransaction = await this.getByID(id.value);
		const fromAccount = await this._accountsService.getByID(
			scheduledTransaction.originAccounts[0].accountId.value,
		);
		const toAccount =
			scheduledTransaction.destinationAccounts.length > 0
				? await this._accountsService.getByID(
						scheduledTransaction.destinationAccounts[0].accountId
							.value,
					)
				: null;
		if (toAccount?.type.value === fromAccount.type.value) {
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
