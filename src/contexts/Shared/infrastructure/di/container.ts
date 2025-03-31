import {
	createContainer,
	asClass,
	InjectionMode,
	AwilixContainer,
	asValue,
} from "awilix";
import { Config } from "../config/config";

import { CategoriesDexieRepository } from "contexts/Categories/infrastructure/persistence/dexie/categories-dexie.repository";
import { ReportsService } from "contexts/Reports/application/reports.service";
import { CreateAccountUseCase } from "contexts/Accounts/application/create-account.usecase";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import { GetAllCategoriesUseCase } from "contexts/Categories/application/get-all-categories.usecase";
import { DeleteSimpleItemUseCase } from "contexts/SimpleItems/application/delete-simple-item.usecase";
import { UpdateSimpleItemUseCase } from "contexts/SimpleItems/application/update-simple-item.usecase";
import { AccountsService } from "contexts/Accounts/application/accounts.service";
import { GetAllAccountNamesUseCase } from "contexts/Accounts/application/get-all-account-names.usecase";
import { GetAllAccountsUseCase } from "contexts/Accounts/application/get-all-accounts.usecase";
import { AccountsDexieRepository } from "contexts/Accounts/infrastructure/persistence/dexie/accounts-dexie.repository";
import { CreateItemUseCase } from "contexts/SimpleItems/application/create-simple-item.usecase";
import { CreateScheduledItemUseCase } from "contexts/ScheduledItems/application/create-scheduled-item.usecase";
import { GetAllScheduledItemsUseCase } from "contexts/ScheduledItems/application/get-all-scheduled-items.usecase";
import { GetAllUniqueItemBrandsUseCase } from "contexts/SimpleItems/application/get-all-unique-item-brands.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/SimpleItems/application/get-all-unique-item-stores.usecase";
import { GetAllUniqueItemsByNameUseCase } from "contexts/SimpleItems/application/get-all-unique-items-by-name.usecase";
import { GetScheduledItemsUntilDateUseCase } from "contexts/ScheduledItems/application/get-scheduled-items-until-date.usecase";
import { SimpleItemsService } from "contexts/SimpleItems/application/simple-items.service";
import { CreateSubCategoryUseCase } from "contexts/Subcategories/application/create-subcategory.usecase";
import { GetAllSubcategoriesUseCase } from "contexts/Subcategories/application/get-all-subcategories.usecase";
import { SubCategoriesService } from "contexts/Subcategories/application/subcategories.service";
import { CategoriesService } from "contexts/Categories/application/categories.service";
import { CreateCategoryUseCase } from "contexts/Categories/application/create-category.usecase";
import { GetAllCategoriesWithSubCategoriesUseCase } from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { SubcategoriesDexieRepository } from "contexts/Subcategories/infrastructure/persistence/dexie/subcategories-dexie.repository";
import { TransactionsDexieRepository } from "contexts/Transactions/infrastructure/persistence/dexie/transactions-dexie.repository";
import { AdjustAccountUseCase } from "contexts/Transactions/application/adjust-account.usecase";
import { DeleteTransactionUseCase } from "contexts/Transactions/application/delete-transaction.usecase";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { RecordSimpleItemUseCase } from "contexts/Transactions/application/record-simple-item.usecase";
import { RecordTransactionUseCase } from "contexts/Transactions/application/record-transaction.usecase";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { UpdateTransactionUseCase } from "contexts/Transactions/application/update-transaction.usecase";
import { SimpleItemsDexieRepository } from "contexts/SimpleItems/infrastructure/persistence/dexie/simple-items-dexie.repository";
import { GetAllTransactionsGroupedByDaysUseCase } from "contexts/Reports/application/get-all-transactions-grouped-by-days.usecase";
import { RecordScheduledItemUseCase } from "contexts/Transactions/application/record-scheduled-item.usecase";
import { ScheduledItemsDexieRepository } from "contexts/ScheduledItems/infrastructure/persistence/dexie/scheduled-items-dexie.repository";
import { ScheduledItemsService } from "contexts/ScheduledItems/application/scheduled-items.service";
import { ModifyNScheduledItemRecurrenceUseCase } from "contexts/ScheduledItems/application/modify-n-scheduled-item-recurrence.usecase";
import { UpdateScheduledItemUseCase } from "contexts/ScheduledItems/application/update-scheduled-item.usecase";
import { DeleteScheduledItemUseCase } from "contexts/ScheduledItems/application/delete-scheduled-item.usecase";

const container = createContainer({
	injectionMode: InjectionMode.CLASSIC,
});

export function buildContainer(): AwilixContainer {
	container.register({
		config: asValue(Config),
		_db: asClass(DexieDB).singleton(),
	});

	// ITEMS
	container.register({
		_itemsRepository: asClass(SimpleItemsDexieRepository).singleton(),
		_itemsService: asClass(SimpleItemsService).singleton(),
		createItemUseCase: asClass(CreateItemUseCase).singleton(),
		getAllUniqueItemsByNameUseCase: asClass(
			GetAllUniqueItemsByNameUseCase
		).singleton(),
		getAllUniqueItemBrandsUseCase: asClass(
			GetAllUniqueItemBrandsUseCase
		).singleton(),
		getAllUniqueItemStoresUseCase: asClass(
			GetAllUniqueItemStoresUseCase
		).singleton(),
		deleteItemUseCase: asClass(DeleteSimpleItemUseCase).singleton(),
		updateItemUseCase: asClass(UpdateSimpleItemUseCase).singleton(),
	});

	// SCHEDULED ITEMS
	container.register({
		_scheduledItemsRepository: asClass(
			ScheduledItemsDexieRepository
		).singleton(),
		_scheduledItemsService: asClass(ScheduledItemsService).singleton(),
		getAllScheduledItemsUseCase: asClass(
			GetAllScheduledItemsUseCase
		).singleton(),
		updateScheduledItemUseCase: asClass(
			UpdateScheduledItemUseCase
		).singleton(),
		deleteScheduledItemUseCase: asClass(
			DeleteScheduledItemUseCase
		).singleton(),
		modifyNScheduledItemRecurrenceUseCase: asClass(
			ModifyNScheduledItemRecurrenceUseCase
		).singleton(),
		getScheduledItemsUntilDateUseCase: asClass(
			GetScheduledItemsUntilDateUseCase
		).singleton(),
		createScheduledItemUseCase: asClass(
			CreateScheduledItemUseCase
		).singleton(),
	});

	// ACCOUNTS
	container.register({
		_accountsRepository: asClass(AccountsDexieRepository).singleton(),
		_accountsService: asClass(AccountsService).singleton(),
		createAccountUseCase: asClass(CreateAccountUseCase).singleton(),
		getAllAccountNamesUseCase: asClass(
			GetAllAccountNamesUseCase
		).singleton(),
		getAllAccountsUseCase: asClass(GetAllAccountsUseCase).singleton(),
	});

	// TRANSACTIONS
	container.register({
		_transactionsRepository: asClass(
			TransactionsDexieRepository
		).singleton(),
		_transactionsService: asClass(TransactionsService).singleton(),
		getAllTransactionsUseCase: asClass(
			GetAllTransactionsUseCase
		).singleton(),
		recordTransactionUseCase: asClass(RecordTransactionUseCase).singleton(),
		recordSimpleItemUseCase: asClass(RecordSimpleItemUseCase).singleton(),
		recordScheduledItemUseCase: asClass(
			RecordScheduledItemUseCase
		).singleton(),
		deleteTransactionUseCase: asClass(DeleteTransactionUseCase).singleton(),
		updateTransactionUseCase: asClass(UpdateTransactionUseCase).singleton(),
		adjustAccountUseCase: asClass(AdjustAccountUseCase).singleton(),
	});

	// CATEGORIES
	container.register({
		_categoriesRepository: asClass(CategoriesDexieRepository).singleton(),
		_subCategoriesRepository: asClass(
			SubcategoriesDexieRepository
		).singleton(),
		_categoriesService: asClass(CategoriesService).singleton(),
		_subCategoriesService: asClass(SubCategoriesService).singleton(),
		createCategoryUseCase: asClass(CreateCategoryUseCase).singleton(),
		createSubCategoryUseCase: asClass(CreateSubCategoryUseCase).singleton(),
		getAllCategoriesWithSubCategoriesUseCase: asClass(
			GetAllCategoriesWithSubCategoriesUseCase
		).singleton(),
		getAllCategoriesUseCase: asClass(GetAllCategoriesUseCase).singleton(),
		getAllSubCategoriesUseCase: asClass(
			GetAllSubcategoriesUseCase
		).singleton(),
	});

	container.register({
		_reportsService: asClass(ReportsService).singleton(),
		getAllTransactionsGroupedByDaysUseCase: asClass(
			GetAllTransactionsGroupedByDaysUseCase
		).singleton(),
	});

	return container;
}

export default container;
