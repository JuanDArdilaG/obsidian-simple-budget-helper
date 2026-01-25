import { DateValueObject } from "@juandardilag/value-objects";
import { describe, expect, it, vi } from "vitest";
import { GetAllAccountsUseCase } from "../../../../src/contexts/Accounts/application/get-all-accounts.usecase";
import { GetScheduledTransactionsUntilDateUseCase } from "../../../../src/contexts/ScheduledTransactions/application/get-items-until-date.usecase";
import { ScheduledTransactionsWithAccumulatedBalanceUseCase } from "../../../../src/contexts/ScheduledTransactions/application/items-with-accumulated-balance.usecase";
import { IRecurrenceModificationsService } from "../../../../src/contexts/ScheduledTransactions/domain";
import { AccountsServiceMock } from "../../Accounts/application/accounts-service.mock";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { buildTestItems } from "../domain/buildTestItems";
import { ScheduledTransactionsServiceMock } from "./items-service.mock";

describe("execute", () => {
	it("should accumulate balance for two items correctly", async () => {
		const accounts = buildTestAccounts(1);
		const items = buildTestItems([
			{
				account: accounts[0],
			},
			{
				account: accounts[0],
			},
		]);
		const scheduledTransactionsService =
			new ScheduledTransactionsServiceMock(items);
		const accountsService = new AccountsServiceMock(accounts);

		// Mock the recurrence modifications service using Jest
		const recurrenceModificationsService: IRecurrenceModificationsService =
			{
				getByScheduledItemId: vi.fn().mockResolvedValue([]),
				getByScheduledItemIdAndOccurrenceIndex: vi
					.fn()
					.mockResolvedValue(null),
				modifyOccurrence: vi.fn(),
				markOccurrenceAsCompleted: vi.fn(),
				markOccurrenceAsDeleted: vi.fn(),
				resetOccurrenceToPending: vi.fn(),
				clearAllModifications: vi.fn(),
				deleteModificationsByScheduledItem: vi.fn(),
				countModificationsByScheduledItem: vi.fn().mockResolvedValue(0),
				getStatsByScheduledItem: vi.fn(),
				getAll: vi.fn().mockResolvedValue([]),
				getByID: vi.fn().mockResolvedValue(null),
				delete: vi.fn(),
				create: vi.fn(),
				exists: vi.fn().mockResolvedValue(false),
				getByCriteria: vi.fn().mockResolvedValue([]),
				update: vi.fn(),
			};

		const getAllAccountsUseCase = new GetAllAccountsUseCase(
			accountsService,
		);

		const useCase = new ScheduledTransactionsWithAccumulatedBalanceUseCase(
			getAllAccountsUseCase,
			new GetScheduledTransactionsUntilDateUseCase(
				scheduledTransactionsService,
				recurrenceModificationsService,
			),
		);

		const itemsWithBalance = await useCase.execute(
			DateValueObject.createNowDate(),
		);

		expect(itemsWithBalance.length).toBe(2);
		expect(itemsWithBalance[0].accountPrevBalance.value.value).toBe(0);
		expect(itemsWithBalance[0].accountBalance.value.value).toBe(-100);
		expect(itemsWithBalance[1].accountPrevBalance.value.value).toBe(-100);
		expect(itemsWithBalance[1].accountBalance.value.value).toBe(-200);

		// Verify that the mock was called
		expect(
			recurrenceModificationsService.getByScheduledItemId,
		).toHaveBeenCalledTimes(2);
	});
});
