import {
	PriceValueObject,
	PriceValueObjectConfig,
} from "@juandardilag/value-objects";

export class TransactionAmount extends PriceValueObject {
	constructor(value: number) {
		super(value, { decimals: 2, withSign: true });
	}

	static fromString(
		strPrice: string,
		config?: PriceValueObjectConfig,
	): PriceValueObject {
		const baseConfig = { decimals: 2, withSign: true };
		const finalConfig = { ...baseConfig, ...config };
		return super.fromString(strPrice, finalConfig);
	}
}
