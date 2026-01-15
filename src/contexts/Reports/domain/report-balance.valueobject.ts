import { PriceValueObject } from "@juandardilag/value-objects";

export class ReportBalance extends PriceValueObject {
	constructor(value: number) {
		super(value, { decimals: 2, withSign: false });
	}
}
