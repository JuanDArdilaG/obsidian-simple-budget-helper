import { DateValueObject } from "@juandardilag/value-objects";
import { Logger } from "../../Shared/infrastructure/logger";
import { ICurrenciesExchangeRateRepository } from "../domain/currency-exchange-rate-repository.interface";
import { Currency } from "../domain/currency.vo";
import { IExchangeRateGetter } from "../domain/exchange-rate-getter.interface";
import { ExchangeRate } from "../domain/exchange-rate.vo";

export class ErExchangeRateGetter implements IExchangeRateGetter {
	readonly #logger = new Logger("ErExchangeRateGetter");
	constructor(
		private readonly _exchangeRateRepository: ICurrenciesExchangeRateRepository
	) {}

	async getExchangeRate(
		fromCurrency: Currency,
		toCurrency: Currency,
		date: DateValueObject
	): Promise<ExchangeRate | null> {
		this.#logger.debug("Getting exchange rate", {
			fromCurrency: fromCurrency.toString(),
			toCurrency: toCurrency.toString(),
			date: date.toString(),
		});
		date.setHours(0, 0, 0, 0);

		const exchangeRate =
			await this._exchangeRateRepository.getByFromToAndDate(
				fromCurrency,
				toCurrency,
				new DateValueObject(
					new Date(
						date.getFullYear(),
						date.getMonth(),
						date.getDate(),
						0,
						0,
						0,
						0
					)
				)
			);
		this.#logger.debug("Found exchange rate in repository", {
			exchangeRate,
		});
		if (exchangeRate) {
			return exchangeRate;
		}

		const response = await fetch(
			`https://v6.exchangerate-api.com/v6/593302958512923249eadf48/latest/${fromCurrency.toString()}`
		);
		this.#logger.debug("Fetched exchange rate from external API", {
			response,
		});
		if (!response.ok) {
			return null;
		}
		const data = await response.json();
		const rate = data.conversion_rates[toCurrency.toString()];
		this.#logger.debug("Parsed exchange rate from API response", { rate });
		if (!rate) {
			return null;
		}

		const newExchangeRate = ExchangeRate.create(
			new Currency(fromCurrency.toString()),
			new Currency(toCurrency.toString()),
			rate,
			date
		);

		await this._exchangeRateRepository.persist(newExchangeRate);
		this.#logger.debug("Persisted new exchange rate to repository", {
			newExchangeRate,
		});

		return newExchangeRate;
	}
}
