import { DateValueObject } from "@juandardilag/value-objects";
import {
	Account,
	AccountBalance,
	IAccountsService,
} from "contexts/Accounts/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ItemRecurrenceInfo, RecurrenceModificationState } from "../domain";
import { GetScheduledTransactionsUntilDateUseCase } from "./get-items-until-date.usecase";

export type ItemWithAccounts = {
	recurrence: ItemRecurrenceInfo;
	account: Account;
	toAccount?: Account;
};

export type ItemWithAccumulatedBalance = {
	recurrence: ItemRecurrenceInfo;
	accountPrevBalance: AccountBalance;
	accountBalance: AccountBalance;
	toAccountPrevBalance?: AccountBalance;
	toAccountBalance?: AccountBalance;
};

export class ScheduledTransactionsWithAccumulatedBalanceUseCase implements QueryUseCase<
	DateValueObject,
	ItemWithAccumulatedBalance[]
> {
	readonly #logger = new Logger(
		"ScheduledTransactionsWithAccumulatedBalanceUseCase",
	);

	constructor(
		private readonly _accountsService: IAccountsService,
		private readonly getScheduledTransactionsUntilDateUseCase: GetScheduledTransactionsUntilDateUseCase,
	) {}

	async getItems(untilDate: DateValueObject): Promise<ItemRecurrenceInfo[]> {
		return await this.getScheduledTransactionsUntilDateUseCase.execute(
			untilDate,
		);
	}

	async getAccounts(): Promise<Account[]> {
		return this._accountsService.getAll();
	}

	preValidate(items: ItemRecurrenceInfo[]): boolean {
		this.#logger.debug("preValidate", {
			length: items.length,
		});
		return items.length > 0;
	}

	sort(items: ItemRecurrenceInfo[]): ItemRecurrenceInfo[] {
		items.sort((a, b) => a.date.compareTo(b.date));
		this.#logger.debug("sort", {
			items: [...items],
		});
		return items;
	}

	filter(scheduledTransactions: ItemRecurrenceInfo[]): ItemRecurrenceInfo[] {
		this.#logger.debug("filter", {
			totalItems: scheduledTransactions.length,
			itemsByState: scheduledTransactions.reduce(
				(acc, item) => {
					acc[item.state] = (acc[item.state] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			),
		});

		const filtered = scheduledTransactions.filter(
			(scheduledTransaction) =>
				scheduledTransaction.state !==
				RecurrenceModificationState.DELETED,
		);

		this.#logger.debug("filtered", {
			filteredCount: filtered.length,
		});

		return filtered;
	}

	initialAccountsBalance(
		items: ItemRecurrenceInfo[],
		allAccounts: Account[],
	): Record<string, AccountBalance> {
		const result: Record<string, AccountBalance> = {};

		// Initialize all accounts with their current balance
		allAccounts.forEach((account) => {
			result[account.id.value] = account.balance;
		});

		// Override with any accounts that have transactions (this shouldn't change anything but ensures consistency)
		items.forEach((item) => {
			result[item.originAccounts[0].account.id.value] =
				item.originAccounts[0].account.balance;
			if (item.destinationAccounts.length > 0)
				result[item.destinationAccounts[0].account.id.value] =
					item.destinationAccounts[0].account.balance;
		});

		this.#logger.debug("initialAccountsBalance", {
			totalAccounts: allAccounts.length,
			accountsWithTransactions: items.length,
			accountBalances: Object.keys(result).map((accountId) => ({
				accountId,
				balance: result[accountId].value.toString(),
			})),
		});
		return result;
	}

	async addItemToAccountBalance(
		recurrence: ItemRecurrenceInfo,
		accountBalance: AccountBalance,
		toAccountBalance?: AccountBalance,
	): Promise<{
		newAccountBalance: AccountBalance;
		newToAccountBalance?: AccountBalance;
	}> {
		const recurrenceAmount = recurrence.getRealPriceForAccount(
			recurrence.operation,
			recurrence.originAccounts[0].account,
			recurrence.originAccounts,
			recurrence.destinationAccounts,
		);
		accountBalance = accountBalance.plus(recurrenceAmount);

		if (toAccountBalance && recurrence.destinationAccounts.length > 0)
			toAccountBalance = toAccountBalance.plus(
				recurrence.getRealPriceForAccount(
					recurrence.operation,
					recurrence.destinationAccounts[0].account,
					recurrence.originAccounts,
					recurrence.destinationAccounts,
				),
			);

		this.#logger.debug("addItemToAccountBalance", {
			recurrence,
			recurrenceAmount,
			accountBalance,
			toAccountBalance,
		});

		return {
			newAccountBalance: accountBalance,
			newToAccountBalance: toAccountBalance,
		};
	}

	async execute(
		untilDate: DateValueObject,
	): Promise<ItemWithAccumulatedBalance[]> {
		this.#logger.debug("execute", { untilDate });

		const recurrenceItems = await this.getItems(untilDate);
		this.#logger.debug("recurrenceItems", {
			count: recurrenceItems.length,
			items: recurrenceItems.map((recurrence) => ({
				itemName: recurrence.name.toString(),
				date: recurrence.date.toString(),
				state: recurrence.state,
			})),
		});

		if (!this.preValidate(recurrenceItems)) return [];

		const accounts = await this.getAccounts();
		this.#logger.debug("accounts", {
			count: accounts.length,
			accounts: accounts.map((acc) => ({
				name: acc.name.toString(),
				balance: acc.balance.value.toString(),
			})),
		});

		const sortedItems = this.sort(recurrenceItems);
		const filteredItems = this.filter(sortedItems);

		this.#logger.debug("filteredItems", {
			filteredItems,
		});
		const initialAccountsBalance: Record<string, AccountBalance> =
			this.initialAccountsBalance(filteredItems, accounts);
		const results = [];

		for (const item of filteredItems) {
			const account = item.originAccounts[0].account;
			const toAccount =
				item.destinationAccounts.length > 0
					? item.destinationAccounts[0].account
					: undefined;
			const accountPrevBalance = initialAccountsBalance[account.id.value];
			const toAccountPrevBalance =
				toAccount && initialAccountsBalance[toAccount.id.value];

			const { newAccountBalance, newToAccountBalance } =
				await this.addItemToAccountBalance(
					item,
					accountPrevBalance,
					toAccountPrevBalance,
				);

			initialAccountsBalance[account.id.value] = newAccountBalance;
			if (toAccount && newToAccountBalance)
				initialAccountsBalance[toAccount.id.value] =
					newToAccountBalance;

			results.push({
				recurrence: item,
				accountPrevBalance,
				accountBalance: newAccountBalance,
				toAccountPrevBalance,
				toAccountBalance: newToAccountBalance,
			});
		}

		this.#logger.debug("final results", {
			count: results.length,
			results: results.map((result) => ({
				itemName: result.recurrence.name.toString(),
				accountBalance: result.accountBalance.value.toString(),
				date: result.recurrence.date.toString(),
			})),
		});

		return results;
	}
}
