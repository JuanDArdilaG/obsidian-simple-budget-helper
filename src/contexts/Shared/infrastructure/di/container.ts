import {
	createContainer,
	asClass,
	InjectionMode,
	AwilixContainer,
} from "awilix";

import { CategoriesDexieRepository } from "contexts/Categories/infrastructure/persistence/dexie/categories-dexie.repository";
import { ReportsService } from "contexts/Reports/application/reports.service";
import { CreateAccountUseCase } from "contexts/Accounts/application/create-account.usecase";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import { GetAllCategoriesUseCase } from "contexts/Categories/application/get-all-categories.usecase";
import { AccountsService } from "contexts/Accounts/application/accounts.service";
import { GetAllAccountNamesUseCase } from "contexts/Accounts/application/get-all-account-names.usecase";
import { GetAllAccountsUseCase } from "contexts/Accounts/application/get-all-accounts.usecase";
import { AccountsDexieRepository } from "contexts/Accounts/infrastructure/persistence/dexie/accounts-dexie.repository";
import { GetAllUniqueItemBrandsUseCase } from "contexts/Transactions/application/get-all-unique-item-brands.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/Transactions/application/get-all-unique-item-stores.usecase";
import { GetAllUniqueItemsByNameUseCase } from "contexts/Items/application/get-all-unique-items-by-name.usecase";
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
import { RecordTransactionUseCase } from "contexts/Transactions/application/record-transaction.usecase";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { UpdateTransactionUseCase } from "contexts/Transactions/application/update-transaction.usecase";
import { ItemsDexieRepository } from "contexts/Items/infrastructure/persistence/dexie/items-dexie.repository";
import { ItemsService } from "contexts/Items/application/items.service";
import { CreateItemUseCase } from "contexts/Items/application/create-item.usecase";
import { DeleteItemUseCase } from "contexts/Items/application/delete-item.usecase";
import { UpdateItemUseCase } from "contexts/Items/application/update-item.usecase";
import { GetAllItemsUseCase } from "contexts/Items/application/get-all-items.usecase";
import { ModifyNItemRecurrenceUseCase } from "contexts/Items/application/modify-n-item-recurrence.usecase";
import { GetItemsUntilDateUseCase } from "contexts/Items/application/get-items-until-date.usecase";
import { RecordItemUseCase } from "contexts/Transactions/application/record-item.usecase";
import { GetAllUniqueTransactionsByNameUseCase } from "contexts/Transactions/application/get-all-unique-transactions.usecase";
import { Logger } from "../logger";
import { GetTotalPerMonthUseCase } from "contexts/Reports/application/get-total-per-month.usecase";
import { GetTotalUseCase } from "contexts/Reports/application/get-total.usecase";
import { ItemsWithAccumulatedBalanceUseCase } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import { RecordItemRecurrenceUseCase } from "contexts/Transactions/application/record-item-recurrence.usecase";
import { GroupByCategoryWithAccumulatedBalanceUseCase } from "contexts/Reports/application/group-by-category-with-accumulated-balance.service";

const container = createContainer({
	injectionMode: InjectionMode.CLASSIC,
});

export function buildContainer(): AwilixContainer {
	container.register({
		_logger: asClass(Logger).singleton(),
		_db: asClass(DexieDB).singleton(),
	});

	// ITEMS
	container.register({
		_itemsRepository: asClass(ItemsDexieRepository).singleton(),
		_itemsService: asClass(ItemsService).singleton(),
		createItemUseCase: asClass(CreateItemUseCase).singleton(),
		getAllItemsUseCase: asClass(GetAllItemsUseCase).singleton(),
		updateItemUseCase: asClass(UpdateItemUseCase).singleton(),
		deleteItemUseCase: asClass(DeleteItemUseCase).singleton(),
		getAllUniqueItemsByNameUseCase: asClass(
			GetAllUniqueItemsByNameUseCase
		).singleton(),
		modifyNItemRecurrenceUseCase: asClass(
			ModifyNItemRecurrenceUseCase
		).singleton(),
		getItemsUntilDateUseCase: asClass(GetItemsUntilDateUseCase).singleton(),
		itemsWithAccumulatedBalanceUseCase: asClass(
			ItemsWithAccumulatedBalanceUseCase
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
		getAllUniqueTransactionsByNameUseCase: asClass(
			GetAllUniqueTransactionsByNameUseCase
		),
		getAllUniqueItemBrandsUseCase: asClass(
			GetAllUniqueItemBrandsUseCase
		).singleton(),
		getAllUniqueItemStoresUseCase: asClass(
			GetAllUniqueItemStoresUseCase
		).singleton(),
		recordTransactionUseCase: asClass(RecordTransactionUseCase).singleton(),
		recordItemUseCase: asClass(RecordItemUseCase).singleton(),
		recordItemRecurrenceUseCase: asClass(
			RecordItemRecurrenceUseCase
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
		_subcategoriesService: asClass(SubCategoriesService).singleton(),
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

	// Reports
	container.register({
		_reportsService: asClass(ReportsService).singleton(),
		getTotalPerMonthUseCase: asClass(GetTotalPerMonthUseCase).singleton(),
		getTotalUseCase: asClass(GetTotalUseCase).singleton(),
		groupByCategoryWithAccumulatedBalanceUseCase: asClass(
			GroupByCategoryWithAccumulatedBalanceUseCase
		).singleton(),
	});

	return container;
}

export default container;
