import { DateValueObject } from "@juandardilag/value-objects";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";

export class Provider extends Entity<ItemID, ProviderPrimitives> {
	readonly _ = new Logger("Provider");

	constructor(
		id: ItemID,
		private _name: ItemName,
		updatedAt: DateValueObject
	) {
		super(id, updatedAt);
	}

	static create(name: ItemName): Provider {
		return new Provider(
			ItemID.generate(),
			name,
			DateValueObject.createNowDate()
		);
	}

	get name(): ItemName {
		return this._name;
	}

	updateName(name: ItemName): void {
		this._name = name;
		this.updateTimestamp();
	}

	copy(): Provider {
		return new Provider(this._id, this._name, this._updatedAt);
	}

	toPrimitives(): ProviderPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives(primitives: ProviderPrimitives): Provider {
		return new Provider(
			new ItemID(primitives.id),
			new ItemName(primitives.name),
			new DateValueObject(new Date(primitives.updatedAt))
		);
	}

	static emptyPrimitives(): ProviderPrimitives {
		return {
			id: "",
			name: "",
			updatedAt: new Date().toISOString(),
		};
	}
}

export type ProviderPrimitives = {
	id: string;
	name: string;
	updatedAt: string;
};
