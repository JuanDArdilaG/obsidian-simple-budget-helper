import { DateValueObject } from "@juandardilag/value-objects";
import { QueryUseCase } from "../../Shared/domain";
import { Currency } from "../domain/currency.vo";
import { IExchangeRateGetter } from "../domain/exchange-rate-getter.interface";
import { ExchangeRate } from "../domain/exchange-rate.vo";

export class GetExchangeRateUseCase implements QueryUseCase<
	{
		fromCurrency: Currency;
		toCurrency: Currency;
		date: DateValueObject;
	},
	ExchangeRate | null
> {
	constructor(private readonly _exchangeRateGetter: IExchangeRateGetter) {}

	async execute({
		fromCurrency,
		toCurrency,
		date,
	}: {
		fromCurrency: Currency;
		toCurrency: Currency;
		date: Date;
	}): Promise<ExchangeRate | null> {
		const exchangeRate = await this._exchangeRateGetter.getExchangeRate(
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
					0,
				),
			),
		);

		return exchangeRate;
	}
}
