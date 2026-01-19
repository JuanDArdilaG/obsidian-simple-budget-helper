import {
	asClass,
	AwilixContainer,
	createContainer,
	InjectionMode,
} from "awilix";

import { AccountsIntegrityService } from "contexts/Accounts/application/accounts-integrity.service";
import { AccountsService } from "contexts/Accounts/application/accounts.service";
import { CalculateAccountIntegrityUseCase } from "contexts/Accounts/application/calculate-account-integrity.usecase";
import { CalculateAllAccountsIntegrityUseCase } from "contexts/Accounts/application/calculate-all-accounts-integrity.usecase";
import { CreateAccountUseCase } from "contexts/Accounts/application/create-account.usecase";
import { DeleteAccountUseCase } from "contexts/Accounts/application/delete-account.usecase";
import { GetAllAccountNamesUseCase } from "contexts/Accounts/application/get-all-account-names.usecase";
import { GetAllAccountsUseCase } from "contexts/Accounts/application/get-all-accounts.usecase";
import { ResolveAccountDiscrepancyUseCase } from "contexts/Accounts/application/resolve-account-discrepancy.usecase";
import { AccountsLocalRepository } from "contexts/Accounts/infrastructure/persistence/local/accounts-local.repository";
import { CategoriesService } from "contexts/Categories/application/categories.service";
import { CreateCategoryUseCase } from "contexts/Categories/application/create-category.usecase";
import { DeleteCategoryUseCase } from "contexts/Categories/application/delete-category.usecase";
import { GetAllCategoriesWithSubCategoriesUseCase } from "contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { GetAllCategoriesUseCase } from "contexts/Categories/application/get-all-categories.usecase";
import { CategoriesLocalRepository } from "contexts/Categories/infrastructure/persistence/local/categories-local.repository";
import { GetTotalPerMonthUseCase } from "contexts/Reports/application/get-total-per-month.usecase";
import { GetTotalUseCase } from "contexts/Reports/application/get-total.usecase";
import { GroupByCategoryWithAccumulatedBalanceUseCase } from "contexts/Reports/application/group-by-category-with-accumulated-balance.service";
import { ReportsService } from "contexts/Reports/application/reports.service";
import { CreateScheduledItemUseCase } from "contexts/ScheduledTransactions/application/create-scheduled-item.usecase";
import { DeleteItemRecurrenceUseCase } from "contexts/ScheduledTransactions/application/delete-scheduled-transaction-recurrence.usecase";
import { ModifyNItemRecurrenceUseCase } from "contexts/ScheduledTransactions/application/modify-n-item-recurrence.usecase";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { StoresLocalRepository } from "contexts/Stores/infrastructure/persistence/stores-local.repository";
import { CreateSubCategoryUseCase } from "contexts/Subcategories/application/create-subcategory.usecase";
import { DeleteSubCategoryUseCase } from "contexts/Subcategories/application/delete-subcategory.usecase";
import { GetAllSubcategoriesUseCase } from "contexts/Subcategories/application/get-all-subcategories.usecase";
import { SubCategoriesService } from "contexts/Subcategories/application/subcategories.service";
import { SubcategoriesLocalRepository } from "contexts/Subcategories/infrastructure/persistence/local/subcategories-local.repository";
import { AdjustAccountUseCase } from "contexts/Transactions/application/adjust-account.usecase";
import { DeleteTransactionUseCase } from "contexts/Transactions/application/delete-transaction.usecase";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/Transactions/application/get-all-unique-item-stores.usecase";
import { GetAllUniqueTransactionsByNameUseCase } from "contexts/Transactions/application/get-all-unique-transactions.usecase";
import { RecordItemUseCase } from "contexts/Transactions/application/record-item.usecase";
import { RecordTransactionUseCase } from "contexts/Transactions/application/record-transaction.usecase";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { UpdateTransactionUseCase } from "contexts/Transactions/application/update-transaction.usecase";
import { TransactionsLocalRepository } from "contexts/Transactions/infrastructure/persistence/local/transactions-local.repository";
import { ChangeAccountNameUseCase } from "../../../Accounts/application/change-account-name.usecase";
import { ChangeAccountSubtypeUseCase } from "../../../Accounts/application/change-account-subtype.usecase";
import { GetExchangeRateUseCase } from "../../../Currencies/application/get-exchange-rate.usecase";
import { ErExchangeRateGetter } from "../../../Currencies/infrastructure/er-exchange-rate-getter";
import { ExchangeRateLocalRepository } from "../../../Currencies/infrastructure/persistence/exchange-rate-local.repository";
import { DeleteScheduledTransactionUseCase } from "../../../ScheduledTransactions/application/delete-scheduled-transaction.usecase";
import { EditScheduledTransactionAmountUseCase } from "../../../ScheduledTransactions/application/edit-scheduled-transaction-amount.usecase";
import { EditScheduledTransactionFrequencyUseCase } from "../../../ScheduledTransactions/application/edit-scheduled-transaction-frequency.usecase";
import { EditScheduledTransactionNameUseCase } from "../../../ScheduledTransactions/application/edit-scheduled-transaction-name.usecase";
import { EditScheduledTransactionStartDateUseCase } from "../../../ScheduledTransactions/application/edit-scheduled-transaction-start-date.usecase";
import { GetAllScheduledTransactionsUseCase } from "../../../ScheduledTransactions/application/get-all-scheduled-transactions";
import { GetScheduledTransactionsUntilDateUseCase } from "../../../ScheduledTransactions/application/get-items-until-date.usecase";
import { ScheduledTransactionsWithAccumulatedBalanceUseCase } from "../../../ScheduledTransactions/application/items-with-accumulated-balance.usecase";
import { NextMonthsExpensesUseCase } from "../../../ScheduledTransactions/application/next-months-expenses.usecase";
import { NextPendingOccurrenceUseCase } from "../../../ScheduledTransactions/application/next-pending-occurrence.usecase";
import { RecordScheduledTransactionUseCase } from "../../../ScheduledTransactions/application/record-scheduled-transaction.usecase";
import { RecurrenceModificationsService } from "../../../ScheduledTransactions/application/recurrence-modifications.service";
import { ScheduledTransactionsService } from "../../../ScheduledTransactions/application/scheduled-transactions.service";
import { RecurrenceModificationsLocalRepository } from "../../../ScheduledTransactions/infrastructure/persistence/recurrence-modifications-local.repository";
import { ScheduledTransactionsLocalRepository } from "../../../ScheduledTransactions/infrastructure/persistence/scheduled-transactions-local.repository";
import { CreateStoreUseCase } from "../../../Stores/application/create-store.usecase";
import { GetAllStoresUseCase } from "../../../Stores/application/get-all-stores.usecase";
import { Logger } from "../logger";

const container = createContainer({
	injectionMode: InjectionMode.CLASSIC,
});

export function buildContainer(localDB?: LocalDB): AwilixContainer {
	container.register({
		_logger: asClass(Logger).singleton(),
	});

	// SCHEDULED TRANSACTIONS
	container.register({
		_storeRepository: asClass(StoresLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_scheduledTransactionsRepository: asClass(
			ScheduledTransactionsLocalRepository,
		)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_scheduledTransactionsService: asClass(
			ScheduledTransactionsService,
		).singleton(),
		_recurrenceModificationsRepository: asClass(
			RecurrenceModificationsLocalRepository,
		)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_recurrenceModificationsService: asClass(
			RecurrenceModificationsService,
		).singleton(),
		getAllScheduledTransactionsUseCase: asClass(
			GetAllScheduledTransactionsUseCase,
		).singleton(),
		createItemUseCase: asClass(CreateScheduledItemUseCase).singleton(),
		deleteScheduledTransactionUseCase: asClass(
			DeleteScheduledTransactionUseCase,
		).singleton(),
		createStoreUseCase: asClass(CreateStoreUseCase).singleton(),
		getAllStoresUseCase: asClass(GetAllStoresUseCase).singleton(),
		deleteItemRecurrenceUseCase: asClass(
			DeleteItemRecurrenceUseCase,
		).singleton(),
		editScheduledTransactionNameUseCase: asClass(
			EditScheduledTransactionNameUseCase,
		).singleton(),
		editScheduledTransactionAmountUseCase: asClass(
			EditScheduledTransactionAmountUseCase,
		).singleton(),
		editScheduledTransactionStartDateUseCase: asClass(
			EditScheduledTransactionStartDateUseCase,
		).singleton(),
		editScheduledTransactionFrequencyUseCase: asClass(
			EditScheduledTransactionFrequencyUseCase,
		).singleton(),
		modifyNItemRecurrenceUseCase: asClass(
			ModifyNItemRecurrenceUseCase,
		).singleton(),
		getScheduledTransactionsUntilDateUseCase: asClass(
			GetScheduledTransactionsUntilDateUseCase,
		).singleton(),
		itemsWithAccumulatedBalanceUseCase: asClass(
			ScheduledTransactionsWithAccumulatedBalanceUseCase,
		).singleton(),
		nextPendingOccurrenceUseCase: asClass(
			NextPendingOccurrenceUseCase,
		).singleton(),
		nextMonthOccurrencesUseCase: asClass(
			NextMonthsExpensesUseCase,
		).singleton(),
	});

	// ACCOUNTS
	container.register({
		_accountsRepository: asClass(AccountsLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_accountsService: asClass(AccountsService).singleton(),
		_accountsIntegrityService: asClass(
			AccountsIntegrityService,
		).singleton(),
		createAccountUseCase: asClass(CreateAccountUseCase).singleton(),
		deleteAccountUseCase: asClass(DeleteAccountUseCase).singleton(),
		getAllAccountNamesUseCase: asClass(
			GetAllAccountNamesUseCase,
		).singleton(),
		getAllAccountsUseCase: asClass(GetAllAccountsUseCase).singleton(),
		calculateAccountIntegrityUseCase: asClass(
			CalculateAccountIntegrityUseCase,
		).singleton(),
		calculateAllAccountsIntegrityUseCase: asClass(
			CalculateAllAccountsIntegrityUseCase,
		).singleton(),
		resolveAccountDiscrepancyUseCase: asClass(
			ResolveAccountDiscrepancyUseCase,
		).singleton(),
		changeAccountNameUseCase: asClass(ChangeAccountNameUseCase).singleton(),
		changeAccountSubtypeUseCase: asClass(
			ChangeAccountSubtypeUseCase,
		).singleton(),
	});

	// TRANSACTIONS
	container.register({
		_transactionsRepository: asClass(TransactionsLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_transactionsService: asClass(TransactionsService).singleton(),
		getAllTransactionsUseCase: asClass(
			GetAllTransactionsUseCase,
		).singleton(),
		getAllUniqueTransactionsByNameUseCase: asClass(
			GetAllUniqueTransactionsByNameUseCase,
		),
		getAllUniqueItemStoresUseCase: asClass(
			GetAllUniqueItemStoresUseCase,
		).singleton(),
		recordTransactionUseCase: asClass(RecordTransactionUseCase).singleton(),
		recordItemUseCase: asClass(RecordItemUseCase).singleton(),
		recordItemRecurrenceUseCase: asClass(
			RecordScheduledTransactionUseCase,
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
		subCategoriesService: asClass(SubCategoriesService).singleton(),
		transactionsService: asClass(TransactionsService).singleton(),
		createCategoryUseCase: asClass(CreateCategoryUseCase).singleton(),
		createSubCategoryUseCase: asClass(CreateSubCategoryUseCase).singleton(),
		getAllCategoriesWithSubCategoriesUseCase: asClass(
			GetAllCategoriesWithSubCategoriesUseCase,
		).singleton(),
		getAllCategoriesUseCase: asClass(GetAllCategoriesUseCase).singleton(),
		getAllSubCategoriesUseCase: asClass(
			GetAllSubcategoriesUseCase,
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
			GroupByCategoryWithAccumulatedBalanceUseCase,
		).singleton(),
	});

	// Exchange Rates
	container.register({
		_exchangeRateRepository: asClass(ExchangeRateLocalRepository)
			.singleton()
			.inject(() => ({ _db: localDB })),
		_exchangeRateGetter: asClass(ErExchangeRateGetter).singleton(),
		getExchangeRateUseCase: asClass(GetExchangeRateUseCase).singleton(),
	});

	return container;
}

export default container;
