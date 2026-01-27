import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { Entity, Nanoid } from "../../Shared/domain";
import { Currency } from "./currency.vo";

export class ExchangeRate extends Entity<string, ExchangeRatePrimitives> {
	constructor(
		id: Nanoid,
		public readonly fromCurrency: Currency,
		public readonly toCurrency: Currency,
		public readonly rate: NumberValueObject,
		public readonly date: DateValueObject,
	) {
		super(id.value, new DateValueObject(new Date()));
		if (rate.isNegative() || rate.isZero()) {
			throw new Error("Exchange rate must be greater than zero.");
		}
	}

	static create(
		fromCurrency: Currency,
		toCurrency: Currency,
		rate: number,
		date: DateValueObject,
	): ExchangeRate {
		return new ExchangeRate(
			Nanoid.generate(),
			fromCurrency,
			toCurrency,
			new NumberValueObject(rate),
			date,
		);
	}

	static fromPrimitives(
		primitives: ExchangeRatePrimitives & { id: string },
	): ExchangeRate {
		return new ExchangeRate(
			new Nanoid(primitives.id),
			new Currency(primitives.fromCurrency),
			new Currency(primitives.toCurrency),
			new NumberValueObject(primitives.rate),
			new DateValueObject(new Date(primitives.date)),
		);
	}

	static emptyPrimitives(): ExchangeRatePrimitives {
		return {
			id: "",
			fromCurrency: "",
			toCurrency: "",
			rate: 0,
			date: new Date().toISOString(),
		};
	}

	toPrimitives(): ExchangeRatePrimitives {
		return {
			id: this.id.toString(),
			fromCurrency: this.fromCurrency.value,
			toCurrency: this.toCurrency.value,
			rate: this.rate.value,
			date: this.date.toString(),
		};
	}
}

export type ExchangeRatePrimitives = {
	id: string;
	fromCurrency: string;
	toCurrency: string;
	rate: number;
	date: string;
};
