import {
	DateValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ItemID } from "./item-id.valueobject";

export class Store extends Entity<ItemID, StorePrimitives> {
	readonly _ = new Logger("Store");

	constructor(
		id: ItemID,
		private _name: StringValueObject,
		updatedAt: DateValueObject
	) {
		super(id, updatedAt);
	}

	static create(name: StringValueObject): Store {
		return new Store(
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

	copy(): Store {
		return new Store(this._id, this._name, this._updatedAt);
	}

	toPrimitives(): StorePrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives(primitives: StorePrimitives): Store {
		return new Store(
			new ItemID(primitives.id),
			new StringValueObject(primitives.name),
			new DateValueObject(new Date(primitives.updatedAt))
		);
	}

	static emptyPrimitives(): StorePrimitives {
		return {
			id: "",
			name: "",
			updatedAt: new Date().toISOString(),
		};
	}
}

export type StorePrimitives = {
	id: string;
	name: string;
	updatedAt: string;
};
