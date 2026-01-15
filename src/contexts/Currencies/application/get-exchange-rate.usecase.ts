import { DateValueObject } from "@juandardilag/value-objects";
import { QueryUseCase } from "../../Shared/domain";
import { Currency } from "../domain/currency.vo";
import { IExchangeRateGetter } from "../domain/exchange-rate-getter.interface";
import { ExchangeRate } from "../domain/exchange-rate.vo";

export class GetExchangeRateUseCase
	implements
		QueryUseCase<
			{
				fromCurrency: Currency;
				toCurrency: Currency;
				date: DateValueObject;
			},
			ExchangeRate | null
		>
{
	constructor(private readonly _exchangeRateGetter: IExchangeRateGetter) {}

	async execute(input: {
		fromCurrency: Currency;
		toCurrency: Currency;
		date: DateValueObject;
	}): Promise<ExchangeRate | null> {
		const fromCurrency = input.fromCurrency;
		const toCurrency = input.toCurrency;

		const exchangeRate = await this._exchangeRateGetter.getExchangeRate(
			fromCurrency,
			toCurrency,
			new DateValueObject(
				new Date(
					input.date.getFullYear(),
					input.date.getMonth(),
					input.date.getDate(),
					0,
					0,
					0,
					0
				)
			)
		);

		return exchangeRate;
	}
}
