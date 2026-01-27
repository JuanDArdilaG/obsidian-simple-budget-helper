import { DateValueObject } from "@juandardilag/value-objects";
import { IRepository } from "../../Shared/domain";
import { Currency } from "./currency.vo";
import { ExchangeRate, ExchangeRatePrimitives } from "./exchange-rate.vo";

export interface ICurrenciesExchangeRateRepository extends IRepository<
	string,
	ExchangeRate,
	ExchangeRatePrimitives
> {
	getByFromToAndDate(
		fromCurrency: Currency,
		toCurrency: Currency,
		date: DateValueObject,
	): Promise<ExchangeRate | null>;
}
