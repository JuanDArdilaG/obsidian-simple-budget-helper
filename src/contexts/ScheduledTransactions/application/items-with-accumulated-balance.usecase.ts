import { DateValueObject } from "@juandardilag/value-objects";
import { Account, AccountBalance } from "contexts/Accounts/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	AccountsMap,
	GetAllAccountsUseCase,
} from "../../Accounts/application/get-all-accounts.usecase";
import { ItemRecurrenceInfo, RecurrenceState } from "../domain";
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
		private readonly getAllAccountsUseCase: GetAllAccountsUseCase,
		private readonly getScheduledTransactionsUntilDateUseCase: GetScheduledTransactionsUntilDateUseCase,
	) {}

	async getItems(untilDate: DateValueObject): Promise<ItemRecurrenceInfo[]> {
		return await this.getScheduledTransactionsUntilDateUseCase.execute(
			untilDate,
		);
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
				scheduledTransaction.state !== RecurrenceState.DELETED,
		);

		this.#logger.debug("filtered", {
			filteredCount: filtered.length,
		});

		return filtered;
	}

	initialAccountsBalance(
		items: ItemRecurrenceInfo[],
		allAccounts: AccountsMap,
	): Record<string, AccountBalance> {
		const result: Record<string, AccountBalance> = {};

		// Initialize all accounts with their current balance
		allAccounts.forEach((account) => {
			result[account.id] = account.balance;
		});

		this.#logger.debug("initialAccountsBalance", {
			totalAccounts: allAccounts.size,
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
		originAccount: Account,
		toAccount: Account | undefined,
		accountBalance: AccountBalance,
		toAccountBalance?: AccountBalance,
	): Promise<{
		newAccountBalance: AccountBalance;
		newToAccountBalance?: AccountBalance;
	}> {
		const recurrenceAmount = recurrence.getRealPriceForAccount(
			recurrence.operation,
			originAccount,
			recurrence.originAccounts,
			recurrence.destinationAccounts,
		);
		accountBalance = accountBalance.plus(recurrenceAmount);

		if (toAccountBalance && toAccount)
			toAccountBalance = toAccountBalance.plus(
				recurrence.getRealPriceForAccount(
					recurrence.operation,
					toAccount,
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

		const accountsMap = await this.getAllAccountsUseCase.execute();
		this.#logger.debug("accounts", {
			count: accountsMap.size,
			accounts: accountsMap,
		});

		const sortedItems = this.sort(recurrenceItems);
		const filteredItems = this.filter(sortedItems);

		this.#logger.debug("filteredItems", {
			filteredItems,
		});
		const initialAccountsBalance: Record<string, AccountBalance> =
			this.initialAccountsBalance(filteredItems, accountsMap);
		const results = [];

		for (const item of filteredItems) {
			const account = accountsMap.get(
				item.originAccounts[0].accountId.value,
			);
			if (!account) {
				this.#logger.error(
					`Account with ID ${item.originAccounts[0].accountId.value} not found`,
					new Error("Account not found"),
				);
				continue;
			}
			const toAccount =
				item.destinationAccounts.length > 0
					? accountsMap.get(
							item.destinationAccounts[0].accountId.value,
						)
					: undefined;
			const accountPrevBalance = initialAccountsBalance[account.id];
			const toAccountPrevBalance =
				toAccount && initialAccountsBalance[toAccount.id];

			const { newAccountBalance, newToAccountBalance } =
				await this.addItemToAccountBalance(
					item,
					account,
					toAccount,
					accountPrevBalance,
					toAccountPrevBalance,
				);

			initialAccountsBalance[account.id] = newAccountBalance;
			if (toAccount && newToAccountBalance)
				initialAccountsBalance[toAccount.id] = newToAccountBalance;

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
