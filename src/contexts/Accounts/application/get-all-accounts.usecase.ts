import { Account, IAccountsService } from "contexts/Accounts/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import { GetExchangeRateUseCase } from "../../Currencies/application/get-exchange-rate.usecase";
import { Currency, ExchangeRate } from "../../Currencies/domain";

export type AccountsMap = Map<string, Account>;

export class GetAllAccountsUseCase implements QueryUseCase<
	string,
	AccountsMap
> {
	constructor(
		private readonly _accountsService: IAccountsService,
		private readonly getExchangeRateUseCase: GetExchangeRateUseCase,
	) {}

	async execute(defaultCurrency: string): Promise<AccountsMap> {
		let accountsArray = (await this._accountsService.getAll()).toSorted(
			(a, b) => a.name.localeCompare(b.name.value),
		);

		const currenciesToConvert = new Set<string>();
		accountsArray.forEach((account) => {
			if (account.currency.value !== defaultCurrency) {
				currenciesToConvert.add(account.currency.value);
			}
		});
		const exchangeRatesMap: Map<string, ExchangeRate> = new Map();
		await Promise.all(
			Array.from(currenciesToConvert).map(async (currency) => {
				const exchangeRate = await this.getExchangeRateUseCase.execute({
					fromCurrency: new Currency(currency),
					toCurrency: new Currency(defaultCurrency),
					date: new Date(),
				});
				if (exchangeRate) {
					exchangeRatesMap.set(currency, exchangeRate);
				}
			}),
		);
		accountsArray = accountsArray.map((account) => {
			if (account.currency.value !== defaultCurrency) {
				account.exchangeRate = exchangeRatesMap.get(
					account.currency.value,
				);
			}
			return account;
		});

		const accountsMap: AccountsMap = new Map();
		accountsArray.forEach((account) => {
			accountsMap.set(account.id, account);
		});
		return accountsMap;
	}
}
