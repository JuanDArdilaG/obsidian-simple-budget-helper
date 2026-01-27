import {
	DateValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { Nanoid } from "../../Shared/domain";

export class Store extends Entity<string, StorePrimitives> {
	readonly _ = new Logger("Store");

	constructor(
		id: Nanoid,
		private _name: StringValueObject,
		updatedAt: DateValueObject,
	) {
		super(id.value, updatedAt);
	}

	static create(name: StringValueObject): Store {
		return new Store(
			Nanoid.generate(),
			name,
			DateValueObject.createNowDate(),
		);
	}

	get name(): StringValueObject {
		return this._name;
	}

	updateName(name: StringValueObject): void {
		this._name = name;
		this.updateTimestamp();
	}

	toPrimitives(): StorePrimitives {
		return {
			id: this._id,
			name: this._name.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives(primitives: StorePrimitives): Store {
		return new Store(
			new Nanoid(primitives.id),
			new StringValueObject(primitives.name),
			new DateValueObject(new Date(primitives.updatedAt)),
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
