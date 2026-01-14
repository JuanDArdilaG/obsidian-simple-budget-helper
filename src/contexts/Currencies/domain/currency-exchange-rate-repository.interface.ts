import { DateValueObject } from "@juandardilag/value-objects";
import { IRepository, Nanoid } from "../../Shared/domain";
import { Currency } from "./currency.vo";
import { ExchangeRate, ExchangeRatePrimitives } from "./exchange-rate.vo";

export interface ICurrenciesExchangeRateRepository
	extends IRepository<Nanoid, ExchangeRate, ExchangeRatePrimitives> {
	getByFromToAndDate(
		fromCurrency: Currency,
		toCurrency: Currency,
		date: DateValueObject
	): Promise<ExchangeRate | null>;
}
