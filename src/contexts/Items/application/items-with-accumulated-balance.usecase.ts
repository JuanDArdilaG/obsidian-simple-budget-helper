import { Logger } from "contexts/Shared/infrastructure/logger";
import { ERecurrenceState, Item, ItemRecurrenceModification } from "../domain";
import {
	Account,
	AccountBalance,
	IAccountsService,
} from "contexts/Accounts/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import {
	GetItemsUntilDateUseCase,
	GetItemsUntilDateUseCaseOutput,
	ItemRecurrenceModificationWithN,
} from "./get-items-until-date.usecase";
import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { IItemsService } from "../domain/items-service.interface";

export type ItemWithAccounts = {
	recurrence: ItemRecurrenceModificationWithN;
	account: Account;
	toAccount?: Account;
};

export type ItemWithAccumulatedBalance = {
	n: NumberValueObject;
	recurrence: ItemRecurrenceModification;
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
		private readonly _itemsService: IItemsService,
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

	preValidate(items: GetItemsUntilDateUseCaseOutput, _: Account[]): boolean {
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
			.filter(({ recurrence }) => {
				this.#logger.debug("addAccounts", {
					item: recurrence,
					account: accounts.find((acc) =>
						acc.id.equalTo(recurrence.account!)
					),
				});
				return accounts.find((acc) =>
					acc.id.equalTo(recurrence.account!)
				);
			})
			.map((recurrence) => ({
				recurrence,
				account: accounts.find((acc) =>
					acc.id.equalTo(recurrence.recurrence.account!)
				)!,
				toAccount:
					recurrence.recurrence.toAccount &&
					accounts.find((acc) =>
						acc.id.equalTo(recurrence.recurrence.toAccount!)
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
		{ recurrence: { recurrence }, account, toAccount }: ItemWithAccounts,
		accountBalance: AccountBalance,
		toAccountBalance?: AccountBalance
	): Promise<{
		newAccountBalance: AccountBalance;
		newToAccountBalance?: AccountBalance;
	}> {
		const item: Item = await this._itemsService.getByID(recurrence.id);
		const recurrenceAmount = recurrence.getRealPriceForAccount(
			item.operation,
			account,
			item.price,
			item.account,
			item.toAccount
		);
		accountBalance = accountBalance.plus(recurrenceAmount);

		if (toAccountBalance && toAccount)
			toAccountBalance = toAccountBalance.plus(
				recurrence.getRealPriceForAccount(
					item.operation,
					toAccount,
					item.price,
					item.account,
					item.toAccount
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

		const accounts = await this.getAccounts();
		if (!this.preValidate(recurrenceItems, accounts)) return [];

		const sortedItems = this.sort(recurrenceItems);
		const filteredItems = this.filter(sortedItems);
		const itemsWithAccount = this.addAccounts(filteredItems, accounts);

		this.#logger.debug("itemsWithAccount", {
			itemsWithAccount,
		});
		const initialAccountsBalance: Record<string, AccountBalance> =
			this.initialAccountsBalance(itemsWithAccount);

		const results = [];

		for (const item of itemsWithAccount) {
			const {
				recurrence: { recurrence, n },
				account,
				toAccount,
			} = item;

			const accountPrevBalance =
				initialAccountsBalance[recurrence.account!.value];
			const toAccountPrevBalance =
				recurrence.toAccount &&
				initialAccountsBalance[recurrence.toAccount.value];

			const { newAccountBalance, newToAccountBalance } =
				await this.addItemToAccountBalance(
					{
						recurrence: { recurrence, n },
						account,
						toAccount,
					},
					accountPrevBalance,
					toAccountPrevBalance
				);

			initialAccountsBalance[recurrence.account!.value] =
				newAccountBalance;
			if (recurrence.toAccount && newToAccountBalance)
				initialAccountsBalance[recurrence.toAccount.value] =
					newToAccountBalance;

			results.push({
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
