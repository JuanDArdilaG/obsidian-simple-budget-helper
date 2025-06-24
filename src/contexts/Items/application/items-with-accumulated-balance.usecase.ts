import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import {
	Account,
	AccountBalance,
	IAccountsService,
} from "contexts/Accounts/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ERecurrenceState, Item, ItemRecurrenceInfo } from "../domain";
import {
	GetItemsUntilDateUseCase,
	GetItemsUntilDateUseCaseOutput,
	ItemRecurrenceModificationWithN,
} from "./get-items-until-date.usecase";

export type ItemWithAccounts = {
	recurrence: ItemRecurrenceModificationWithN;
	account: Account;
	toAccount?: Account;
};

export type ItemWithAccumulatedBalance = {
	item: Item;
	n: NumberValueObject;
	recurrence: ItemRecurrenceInfo;
	accountPrevBalance: AccountBalance;
	accountBalance: AccountBalance;
	toAccountPrevBalance?: AccountBalance;
	toAccountBalance?: AccountBalance;
};

export class ItemsWithAccumulatedBalanceUseCase
	implements QueryUseCase<DateValueObject, ItemWithAccumulatedBalance[]>
{
	readonly #logger = new Logger("ItemsWithAccumulatedBalanceService");

	constructor(
		private readonly _accountsService: IAccountsService,
		private readonly getItemsUntilDateUseCase: GetItemsUntilDateUseCase
	) {}

	async getItems(
		untilDate: DateValueObject
	): Promise<GetItemsUntilDateUseCaseOutput> {
		return await this.getItemsUntilDateUseCase.execute(untilDate);
	}

	async getAccounts(): Promise<Account[]> {
		return this._accountsService.getAll();
	}

	preValidate(items: GetItemsUntilDateUseCaseOutput): boolean {
		this.#logger.debug("preValidate", {
			length: items.length,
		});
		return items.length > 0;
	}

	sort(
		items: GetItemsUntilDateUseCaseOutput
	): GetItemsUntilDateUseCaseOutput {
		items.sort(({ recurrence: a }, { recurrence: b }) =>
			a.date.compareTo(b.date)
		);
		this.#logger.debug("sort", {
			items: [...items],
		});
		return items;
	}

	filter(
		items: GetItemsUntilDateUseCaseOutput
	): GetItemsUntilDateUseCaseOutput {
		return items.filter(
			({ recurrence }) => recurrence.state === ERecurrenceState.PENDING
		);
	}

	addAccounts(
		recurrences: GetItemsUntilDateUseCaseOutput,
		accounts: Account[]
	): ItemWithAccounts[] {
		return recurrences
			.filter(({ recurrence, item }) => {
				this.#logger.debug("addAccounts", {
					item: recurrence,
					account: accounts.find((acc) =>
						acc.id.equalTo(
							recurrence.account ?? item.operation.account
						)
					),
				});
				return accounts.find((acc) =>
					acc.id.equalTo(recurrence.account ?? item.operation.account)
				);
			})
			.map(({ recurrence, item, n }) => ({
				item,
				recurrence: { recurrence, item, n },
				account: accounts.find((acc) =>
					acc.id.equalTo(recurrence.account ?? item.operation.account)
				)!,
				toAccount:
					item.operation.toAccount &&
					accounts.find((acc) =>
						acc.id.equalTo(
							recurrence.toAccount ?? item.operation.toAccount!
						)
					),
			}));
	}

	initialAccountsBalance(
		itemsWithAccount: ItemWithAccounts[]
	): Record<string, AccountBalance> {
		const result: Record<string, AccountBalance> = {};
		itemsWithAccount.forEach(({ account, toAccount }) => {
			result[account.id.value] = account.balance;
			if (toAccount) result[toAccount.id.value] = toAccount.balance;
		});
		this.#logger.debug("initialAccountsBalance", {
			result,
		});
		return result;
	}

	async addItemToAccountBalance(
		{
			recurrence: { recurrence, item },
			account,
			toAccount,
		}: ItemWithAccounts,
		accountBalance: AccountBalance,
		toAccountBalance?: AccountBalance
	): Promise<{
		newAccountBalance: AccountBalance;
		newToAccountBalance?: AccountBalance;
	}> {
		const recurrenceAmount = recurrence.getRealPriceForAccount(
			item.operation,
			account,
			item.fromAmount,
			item.operation.account,
			item.operation.toAccount
		);
		accountBalance = accountBalance.plus(recurrenceAmount);

		if (toAccountBalance && toAccount)
			toAccountBalance = toAccountBalance.plus(
				recurrence.getRealPriceForAccount(
					item.operation,
					toAccount,
					item.toAmount,
					item.operation.account,
					item.operation.toAccount
				)
			);

		this.#logger.debug("addItemToAccountBalance", {
			item,
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
		untilDate: DateValueObject
	): Promise<ItemWithAccumulatedBalance[]> {
		this.#logger.debug("execute", { untilDate });

		const recurrenceItems = await this.getItems(untilDate);
		if (!this.preValidate(recurrenceItems)) return [];

		const accounts = await this.getAccounts();

		const sortedItems = this.sort(recurrenceItems);
		const filteredItems = this.filter(sortedItems);
		const itemsWithAccount = this.addAccounts(filteredItems, accounts);

		this.#logger.debug("itemsWithAccount", {
			itemsWithAccount,
		});
		const initialAccountsBalance: Record<string, AccountBalance> =
			this.initialAccountsBalance(itemsWithAccount);

		const results = [];

		for (const itemWithAccount of itemsWithAccount) {
			const {
				recurrence: { recurrence, n, item },
				account,
				toAccount,
			} = itemWithAccount;

			const accountPrevBalance = initialAccountsBalance[account.id.value];
			const toAccountPrevBalance =
				toAccount && initialAccountsBalance[toAccount.id.value];

			const { newAccountBalance, newToAccountBalance } =
				await this.addItemToAccountBalance(
					{
						recurrence: { recurrence, n, item },
						account,
						toAccount,
					},
					accountPrevBalance,
					toAccountPrevBalance
				);

			initialAccountsBalance[account.id.value] = newAccountBalance;
			if (toAccount && newToAccountBalance)
				initialAccountsBalance[toAccount.id.value] =
					newToAccountBalance;

			results.push({
				item,
				n,
				recurrence: recurrence,
				accountPrevBalance,
				accountBalance: newAccountBalance,
				toAccountPrevBalance,
				toAccountBalance: newToAccountBalance,
			});
		}

		return results;
	}
}
