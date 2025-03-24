import {
	createContainer,
	asClass,
	InjectionMode,
	AwilixContainer,
	asValue,
} from "awilix";
import { ItemsDexieRepository } from "contexts/Items/infrastructure";
import { Config } from "../config/config";
import {
	GetAllUniqueItemsByNameUseCase,
	CreateSimpleItemUseCase,
	CreateRecurrentItemUseCase,
} from "contexts/Items/application";
import {
	AccountsService,
	GetAllAccountNamesUseCase,
	GetAllAccountsUseCase,
} from "contexts/Accounts/application";
import { AccountsDexieRepository } from "contexts/Accounts/infrastructure";

import {
	RecordSimpleItemUseCase,
	DeleteTransactionUseCase,
	GetAllTransactionsUseCase,
	UpdateTransactionUseCase,
	RecordRecurrentItemUseCase,
	RecordTransactionUseCase,
	TransactionsService,
	AdjustAccountUseCase,
} from "contexts/Transactions/application";
import { TransactionsDexieRepository } from "contexts/Transactions/infrastructure";
import {
	GetAllCategoriesWithSubCategoriesUseCase,
	CreateCategoryUseCase,
	CategoriesService,
} from "contexts/Categories/application";
import { CategoriesDexieRepository } from "contexts/Categories/infrastructure";
import { SubcategoriesDexieRepository } from "contexts/Subcategories/infrastructure";
import {
	GetAllUniqueItemBrandsUseCase,
	GetAllUniqueItemStoresUseCase,
} from "contexts/Items/application";
import {
	GetAllTransactionsGroupedByDaysUseCase,
	ReportsService,
} from "contexts/Reports/application";
import { CreateAccountUseCase } from "contexts/Accounts/application/create-account.usecase";
import { DexieDB } from "contexts/Shared/infrastructure";
import {
	CreateSubCategoryUseCase,
	GetAllSubcategoriesUseCase,
	SubCategoriesService,
} from "contexts/Subcategories/application";
import { GetAllCategoriesUseCase } from "contexts/Categories/application/get-all-categories.usecase";

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
		_itemsRepository: asClass(ItemsDexieRepository).singleton(),
		createSimpleItemUseCase: asClass(CreateSimpleItemUseCase).singleton(),
		createRecurrentItemUseCase: asClass(
			CreateRecurrentItemUseCase
		).singleton(),
		getAllUniqueItemsByNameUseCase: asClass(
			GetAllUniqueItemsByNameUseCase
		).singleton(),
		getAllUniqueItemBrandsUseCase: asClass(
			GetAllUniqueItemBrandsUseCase
		).singleton(),
		getAllUniqueItemStoresUseCase: asClass(
			GetAllUniqueItemStoresUseCase
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
		recordRecurrentItemUseCase: asClass(
			RecordRecurrentItemUseCase
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
