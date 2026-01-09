import { StringValueObject } from "@juandardilag/value-objects";

export class ItemProductInfo {
	constructor(
		readonly info: { brand?: StringValueObject; store?: StringValueObject }
	) {}

	get brand(): StringValueObject | undefined {
		return this.info.brand;
	}

	updateBrand(brand: StringValueObject | undefined): void {
		this.info.brand = brand;
	}

	get store(): StringValueObject | undefined {
		return this.info.store;
	}

	updateStore(store: StringValueObject | undefined): void {
		this.info.store = store;
	}
}
