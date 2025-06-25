import { ItemBrand } from "./item-brand.valueobject";
import { ItemStore } from "./item-store.valueobject";

export class ItemProductInfo {
	constructor(readonly info: { brand?: ItemBrand; store?: ItemStore }) {}

	get brand(): ItemBrand | undefined {
		return this.info.brand;
	}

	get store(): ItemStore | undefined {
		return this.info.store;
	}
}
