import { ItemsWithAccumulatedBalanceUseCase } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import { describe, it, expect } from "vitest";
import { ItemsServiceMock } from "./items-service.mock";
import { AccountsServiceMock } from "../../Accounts/application/accounts-service.mock";
import { GetItemsUntilDateUseCase } from "contexts/Items/application/get-items-until-date.usecase";
import { buildTestItems } from "../domain/buildTestItems";
import { DateValueObject } from "@juandardilag/value-objects";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

describe("execute", () => {
	it("should accmulate balance for two items correctly", async () => {
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
		const useCase = new ItemsWithAccumulatedBalanceUseCase(
			accountsService,
			new GetItemsUntilDateUseCase(itemsService)
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
