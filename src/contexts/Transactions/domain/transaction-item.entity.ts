import { Nanoid } from "../../Shared/domain";
import { PriceVO } from "../../Shared/domain/value-objects/price.vo";
import { TransactionName } from "./item-name.valueobject";

export class TransactionItem {
	constructor(
		private readonly _name: TransactionName,
		private readonly _price: PriceVO,
		private readonly _quantity: number,
		private readonly _categoryId: Nanoid,
		private readonly _subcategoryId: Nanoid,
	) {}

	get name(): TransactionName {
		return this._name;
	}

	get price(): PriceVO {
		return this._price;
	}

	get quantity(): number {
		return this._quantity;
	}

	get categoryId(): Nanoid {
		return this._categoryId;
	}

	get subcategoryId(): Nanoid {
		return this._subcategoryId;
	}

	toPrimitives(): TransactionItemPrimitives {
		return {
			name: this._name.value,
			price: this._price.value,
			quantity: this._quantity,
			categoryId: this._categoryId.value,
			subcategoryId: this._subcategoryId.value,
		};
	}

	static fromPrimitives(
		primitives: TransactionItemPrimitives,
	): TransactionItem {
		return new TransactionItem(
			new TransactionName(primitives.name),
			new PriceVO(primitives.price),
			primitives.quantity,
			new Nanoid(primitives.categoryId),
			new Nanoid(primitives.subcategoryId),
		);
	}
}

export interface TransactionItemPrimitives {
	name: string;
	price: number;
	quantity: number;
	categoryId: string;
	subcategoryId: string;
}
