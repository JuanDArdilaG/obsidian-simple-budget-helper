import {
	DateValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ItemID } from "./item-id.valueobject";

export class Brand extends Entity<ItemID, BrandPrimitives> {
	readonly _ = new Logger("Brand");

	constructor(
		id: ItemID,
		private _name: StringValueObject,
		updatedAt: DateValueObject
	) {
		super(id, updatedAt);
	}

	static create(name: StringValueObject): Brand {
		return new Brand(
			ItemID.generate(),
			name,
			DateValueObject.createNowDate()
		);
	}

	get name(): StringValueObject {
		return this._name;
	}

	updateName(name: StringValueObject): void {
		this._name = name;
		this.updateTimestamp();
	}

	copy(): Brand {
		return new Brand(this._id, this._name, this._updatedAt);
	}

	toPrimitives(): BrandPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives(primitives: BrandPrimitives): Brand {
		return new Brand(
			new ItemID(primitives.id),
			new StringValueObject(primitives.name),
			new DateValueObject(new Date(primitives.updatedAt))
		);
	}

	static emptyPrimitives(): BrandPrimitives {
		return {
			id: "",
			name: "",
			updatedAt: new Date().toISOString(),
		};
	}
}

export type BrandPrimitives = {
	id: string;
	name: string;
	updatedAt: string;
};
