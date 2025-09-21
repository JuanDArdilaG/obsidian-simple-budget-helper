import { DateValueObject } from "@juandardilag/value-objects";
import { IDValueObject } from "./value-objects/id/id.valueobject";

export type EntityComposedValue = Record<string, unknown>;

export abstract class Entity<
	EntityID extends IDValueObject,
	EntityPrimitives extends EntityComposedValue
> {
	constructor(
		protected _id: EntityID,
		protected _updatedAt: DateValueObject
	) {}

	get id(): EntityID {
		return this._id;
	}

	get updatedAt(): DateValueObject {
		return this._updatedAt;
	}

	protected updateTimestamp(): void {
		this._updatedAt = DateValueObject.createNowDate();
	}

	abstract toPrimitives(): EntityPrimitives;
}
