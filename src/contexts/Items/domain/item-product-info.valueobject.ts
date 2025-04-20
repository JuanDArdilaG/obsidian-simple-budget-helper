import { RecordValueObject } from "@juandardilag/value-objects";
import { ItemBrand } from "./item-brand.valueobject";
import { ItemStore } from "./item-store.valueobject";

export class ItemProductInfo extends RecordValueObject {
	constructor(info: { brand?: ItemBrand; store?: ItemStore }) {
		super(info);
	}
}
