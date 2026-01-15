import { DateValueObject } from "@juandardilag/value-objects";
import { Currency } from "./currency.vo";
import { ExchangeRate } from "./exchange-rate.vo";

export interface IExchangeRateGetter {
	getExchangeRate(
		fromCurrency: Currency,
		toCurrency: Currency,
		date: DateValueObject
	): Promise<ExchangeRate | null>;
}
