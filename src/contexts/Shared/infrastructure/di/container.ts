import {
	asClass,
	AwilixContainer,
	createContainer,
	InjectionMode,
} from "awilix";

import { AccountsService } from "contexts/Accounts/application/accounts.service";
import { CreateAccountUseCase } from "contexts/Accounts/application/create-account.usecase";
import { DeleteAccountUseCase } from "contexts/Accounts/application/delete-account.usecase";
import { GetAllAccountNamesUseCase } from "contexts/Accounts/application/get-all-account-names.usecase";
import { GetAllAccountsUseCase } from "contexts/Accounts/application/get-all-accounts.usecase";
import { AccountsLocalRepository } from "contexts/Accounts/infrastructure/persistence/local/accounts-local.repository";
import { CategoriesService } from "contexts/Categories/application/categories.service";
import { CreateCategoryUseCase } from "contexts/Categories/application/create-category.usecase";
import { DeleteCategoryUseCase } from "contexts/Categories/application/delete-category.usecase";
import { GetAllCategoriesWithSubCategoriesUseCase } from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { GetAllCategoriesUseCase } from "contexts/Categories/application/get-all-categories.usecase";
import { CategoriesLocalRepository } from "contexts/Categories/infrastructure/persistence/local/categories-local.repository";
import { CreateBrandUseCase } from "contexts/Items/application/create-brand.usecase";
import { CreateItemUseCase } from "contexts/Items/application/create-item.usecase";
import { CreateProviderUseCase } from "contexts/Items/application/create-provider.usecase";
import { CreateRegularItemUseCase } from "contexts/Items/application/create-regular-item.usecase";
import { CreateStoreUseCase } from "contexts/Items/application/create-store.usecase";
import { DeleteItemUseCase } from "contexts/Items/application/delete-item.usecase";
import { GetAllBrandsUseCase } from "contexts/Items/application/get-all-brands.usecase";
import { GetAllItemsUseCase } from "contexts/Items/application/get-all-items.usecase";
import { GetAllProvidersUseCase } from "contexts/Items/application/get-all-providers.usecase";
import { GetAllRegularItemsUseCase } from "contexts/Items/application/get-all-regular-items.usecase";
import { GetAllStoresUseCase } from "contexts/Items/application/get-all-stores.usecase";
import { GetAllUniqueItemsByNameUseCase } from "contexts/Items/application/get-all-unique-items-by-name.usecase";
import { GetItemsUntilDateUseCase } from "contexts/Items/application/get-items-until-date.usecase";
import { ItemsWithAccumulatedBalanceUseCase } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import { ItemsService } from "contexts/Items/application/items.service";
import { ModifyNItemRecurrenceUseCase } from "contexts/Items/application/modify-n-item-recurrence.usecase";
import { UpdateItemUseCase } from "contexts/Items/application/update-item.usecase";
import { UpdateRegularItemUseCase } from "contexts/Items/application/update-regular-item.usecase";
import { BrandsLocalRepository } from "contexts/Items/infrastructure/persistence/local/brands-local.repository";
import { ItemsLocalRepository } from "contexts/Items/infrastructure/persistence/local/items-local.repository";
import { ProvidersLocalRepository } from "contexts/Items/infrastructure/persistence/local/providers-local.repository";
import { ScheduledItemsLocalRepository } from "contexts/Items/infrastructure/persistence/local/scheduled-items-local.repository";
import { StoresLocalRepository } from "contexts/Items/infrastructure/persistence/local/stores-local.repository";
import { GetTotalPerMonthUseCase } from "contexts/Reports/application/get-total-per-month.usecase";
import { GetTotalUseCase } from "contexts/Reports/application/get-total.usecase";
import { GroupByCategoryWithAccumulatedBalanceUseCase } from "contexts/Reports/application/group-by-category-with-accumulated-balance.service";
import { ReportsService } from "contexts/Reports/application/reports.service";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { CreateSubCategoryUseCase } from "contexts/Subcategories/application/create-subcategory.usecase";
import { DeleteSubCategoryUseCase } from "contexts/Subcategories/application/delete-subcategory.usecase";
import { GetAllSubcategoriesUseCase } from "contexts/Subcategories/application/get-all-subcategories.usecase";
import { SubCategoriesService } from "contexts/Subcategories/application/subcategories.service";
import { SubcategoriesLocalRepository } from "contexts/Subcategories/infrastructure/persistence/local/subcategories-local.repository";
import { AdjustAccountUseCase } from "contexts/Transactions/application/adjust-account.usecase";
import { DeleteTransactionUseCase } from "contexts/Transactions/application/delete-transaction.usecase";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { GetAllUniqueItemBrandsUseCase } from "contexts/Transactions/application/get-all-unique-item-brands.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/Transactions/application/get-all-unique-item-stores.usecase";
import { GetAllUniqueTransactionsByNameUseCase } from "contexts/Transactions/application/get-all-unique-transactions.usecase";
import { RecordItemRecurrenceUseCase } from "contexts/Transactions/application/record-item-recurrence.usecase";
import { RecordItemUseCase } from "contexts/Transactions/application/record-item.usecase";
import { RecordTransactionUseCase } from "contexts/Transactions/application/record-transaction.usecase";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { UpdateTransactionUseCase } from "contexts/Transactions/application/update-transaction.usecase";
import { TransactionsLocalRepository } from "contexts/Transactions/infrastructure/persistence/local/transactions-local.repository";
import { Logger } from "../logger";

const container = createContainer({
	injectionMode: InjectionMode.CLASSIC,
});

export function buildContainer(localDB?: LocalDB): AwilixContainer {
	container.register({
		_logger: asClass(Logger).singleton(),
	});

	// ITEMS
	container.register({
		_itemsRepository: asClass(ItemsLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_scheduledItemsRepository: asClass(ScheduledItemsLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_brandRepository: asClass(BrandsLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_storeRepository: asClass(StoresLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_providerRepository: asClass(ProvidersLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_itemsService: asClass(ItemsService).singleton(),
		createItemUseCase: asClass(CreateItemUseCase).singleton(),
		createRegularItemUseCase: asClass(CreateRegularItemUseCase).singleton(),
		createBrandUseCase: asClass(CreateBrandUseCase).singleton(),
		createStoreUseCase: asClass(CreateStoreUseCase).singleton(),
		createProviderUseCase: asClass(CreateProviderUseCase).singleton(),
		getAllItemsUseCase: asClass(GetAllItemsUseCase).singleton(),
		getAllBrandsUseCase: asClass(GetAllBrandsUseCase).singleton(),
		getAllStoresUseCase: asClass(GetAllStoresUseCase).singleton(),
		getAllProvidersUseCase: asClass(GetAllProvidersUseCase).singleton(),
		updateItemUseCase: asClass(UpdateItemUseCase).singleton(),
		updateRegularItemUseCase: asClass(UpdateRegularItemUseCase).singleton(),
		deleteItemUseCase: asClass(DeleteItemUseCase).singleton(),
		getAllUniqueItemsByNameUseCase: asClass(
			GetAllUniqueItemsByNameUseCase
		).singleton(),
		getAllRegularItemsUseCase: asClass(
			GetAllRegularItemsUseCase
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
		_accountsRepository: asClass(AccountsLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_accountsService: asClass(AccountsService).singleton(),
		createAccountUseCase: asClass(CreateAccountUseCase).singleton(),
		deleteAccountUseCase: asClass(DeleteAccountUseCase).singleton(),
		getAllAccountNamesUseCase: asClass(
			GetAllAccountNamesUseCase
		).singleton(),
		getAllAccountsUseCase: asClass(GetAllAccountsUseCase).singleton(),
	});

	// TRANSACTIONS
	container.register({
		_transactionsRepository: asClass(TransactionsLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
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
		_categoriesRepository: asClass(CategoriesLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_subCategoriesRepository: asClass(SubcategoriesLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		categoriesService: asClass(CategoriesService).singleton(),
		subcategoriesService: asClass(SubCategoriesService).singleton(),
		transactionsService: asClass(TransactionsService).singleton(),
		itemsService: asClass(ItemsService).singleton(),
		createCategoryUseCase: asClass(CreateCategoryUseCase).singleton(),
		createSubCategoryUseCase: asClass(CreateSubCategoryUseCase).singleton(),
		getAllCategoriesWithSubCategoriesUseCase: asClass(
			GetAllCategoriesWithSubCategoriesUseCase
		).singleton(),
		getAllCategoriesUseCase: asClass(GetAllCategoriesUseCase).singleton(),
		getAllSubCategoriesUseCase: asClass(
			GetAllSubcategoriesUseCase
		).singleton(),
		deleteCategoryUseCase: asClass(DeleteCategoryUseCase).singleton(),
		deleteSubCategoryUseCase: asClass(DeleteSubCategoryUseCase).singleton(),
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
