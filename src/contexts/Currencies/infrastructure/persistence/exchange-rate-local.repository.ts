import { DateValueObject } from "@juandardilag/value-objects";
import { Nanoid } from "../../../Shared/domain";
import { Config } from "../../../Shared/infrastructure/config/config";
import { LocalDB } from "../../../Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "../../../Shared/infrastructure/persistence/local/local.repository";
import { ICurrenciesExchangeRateRepository } from "../../domain/currency-exchange-rate-repository.interface";
import { Currency } from "../../domain/currency.vo";
import {
	ExchangeRate,
	ExchangeRatePrimitives,
} from "../../domain/exchange-rate.vo";

export class ExchangeRateLocalRepository
	extends LocalRepository<Nanoid, ExchangeRate, ExchangeRatePrimitives>
	implements ICurrenciesExchangeRateRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.exchangeRatesTableName);
	}

	async getByFromToAndDate(
		fromCurrency: Currency,
		toCurrency: Currency,
		date: DateValueObject,
	): Promise<ExchangeRate | null> {
		const allRecords = await this.findAll();

		return (
			allRecords.find((rate) => {
				const primitives = rate.toPrimitives();
				console.log("Comparing exchange rate record", {
					record: primitives,
					fromCurrency: fromCurrency.value,
					toCurrency: toCurrency.value,
					date: date.value.toString(),
				});
				return (
					primitives.fromCurrency === fromCurrency.value &&
					primitives.toCurrency === toCurrency.value &&
					primitives.date === date.value.toString()
				);
			}) ?? null
		);
	}

	protected mapToDomain(record: ExchangeRatePrimitives): ExchangeRate {
		return ExchangeRate.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: ExchangeRate): ExchangeRatePrimitives {
		return entity.toPrimitives();
	}
}
