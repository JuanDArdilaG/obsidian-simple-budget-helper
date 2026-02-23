import { StringValueObject } from "@juandardilag/value-objects";
import { Entity, Nanoid } from "../../Shared/domain";
import { TransactionAmount } from "../../Transactions/domain";

export class PhysicalAsset extends Entity<string, PhysicalAssetPrimitives> {
	constructor(
		id: Nanoid,
		private readonly _name: StringValueObject,
		private readonly _category: Nanoid,
		private readonly _subcategory: Nanoid,
		private readonly _usefulLifeInYears: number,
		private readonly _purchaseDate: Date,
		private readonly _purchasePrice: TransactionAmount,
	) {
		super(id.value, new Date());
	}

	get name(): StringValueObject {
		return this._name;
	}

	get category(): Nanoid {
		return this._category;
	}

	get subcategory(): Nanoid {
		return this._subcategory;
	}

	get usefulLifeInYears(): number {
		return this._usefulLifeInYears;
	}

	get purchaseDate(): Date {
		return this._purchaseDate;
	}

	get purchasePrice(): TransactionAmount {
		return this._purchasePrice;
	}

	get currentValue(): TransactionAmount {
		const now = new Date();
		const ageInMilliseconds = now.getTime() - this._purchaseDate.getTime();
		const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
		// Straight-line depreciation
		const depreciationFactor = Math.min(
			1,
			Math.max(0, ageInYears / this.usefulLifeInYears),
		);
		const currentValue =
			this.purchasePrice.value * (1 - depreciationFactor);
		return new TransactionAmount(currentValue);
	}

	toPrimitives(): PhysicalAssetPrimitives {
		return {
			id: this._id,
			name: this._name.value,
			category: this._category.value,
			subcategory: this._subcategory.value,
			purchaseDate: this._purchaseDate.toISOString(),
			usefulLifeInYears: this._usefulLifeInYears,
			purchasePrice: this._purchasePrice.value,
		};
	}

	static fromPrimitives({
		id,
		name,
		category,
		subcategory,
		purchaseDate,
		usefulLifeInYears,
		purchasePrice,
	}: PhysicalAssetPrimitives): PhysicalAsset {
		return new PhysicalAsset(
			new Nanoid(id),
			new StringValueObject(name),
			new Nanoid(category),
			new Nanoid(subcategory),
			usefulLifeInYears,
			new Date(purchaseDate),
			new TransactionAmount(purchasePrice),
		);
	}

	static emptyPrimitives(): PhysicalAssetPrimitives {
		return {
			id: "",
			category: "",
			subcategory: "",
			name: "",
			purchaseDate: new Date().toISOString(),
			usefulLifeInYears: 0,
			purchasePrice: 0,
		};
	}
}

export type PhysicalAssetPrimitives = {
	id: string;
	name: string;
	category: string;
	subcategory: string;
	purchaseDate: string;
	usefulLifeInYears: number;
	purchasePrice: number;
};
