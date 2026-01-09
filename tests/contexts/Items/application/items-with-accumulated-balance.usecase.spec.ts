import { DateValueObject } from "@juandardilag/value-objects";
import { describe, expect, it } from "vitest";
import { GetScheduledTransactionsUntilDateUseCase } from "../../../../src/contexts/ScheduledTransactions/application/get-items-until-date.usecase";
import { ScheduledTransactionsWithAccumulatedBalanceUseCase } from "../../../../src/contexts/ScheduledTransactions/application/items-with-accumulated-balance.usecase";
import { AccountsServiceMock } from "../../Accounts/application/accounts-service.mock";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { buildTestItems } from "../domain/buildTestItems";
import { ItemsServiceMock } from "./items-service.mock";

describe("execute", () => {
	it("should accumulate balance for two items correctly", async () => {
		const accounts = buildTestAccounts(1);
		const items = buildTestItems([
			{
				account: accounts[0].id,
			},
			{
				account: accounts[0].id,
			},
		]);
		const itemsService = new ItemsServiceMock(items);
		const accountsService = new AccountsServiceMock(accounts);
		const useCase = new ScheduledTransactionsWithAccumulatedBalanceUseCase(
			accountsService,
			new GetScheduledTransactionsUntilDateUseCase(itemsService)
		);

		const itemsWithBalance = await useCase.execute(
			DateValueObject.createNowDate()
		);

		expect(itemsWithBalance.length).toBe(2);
		expect(itemsWithBalance[0].accountPrevBalance.value.value).toBe(0);
		expect(itemsWithBalance[0].accountBalance.value.value).toBe(-100);
		expect(itemsWithBalance[1].accountPrevBalance.value.value).toBe(-100);
		expect(itemsWithBalance[1].accountBalance.value.value).toBe(-200);
	});
});
