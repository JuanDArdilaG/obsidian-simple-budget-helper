import { DateValueObject } from "@juandardilag/value-objects";
import { IDValueObject } from "./value-objects/id/id.valueobject";

type AtomicValue = string | number | Date | undefined;
type AtomicRecord = Record<string, AtomicValue>;
type ComposedRecord = Record<
	string,
	AtomicValue | AtomicRecord | AtomicRecord[]
>;
export type EntityComposedValue = Record<
	string,
	AtomicValue | AtomicRecord | AtomicRecord[] | ComposedRecord
>;

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
