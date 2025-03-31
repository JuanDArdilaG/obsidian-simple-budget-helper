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
	constructor(protected _id: EntityID) {}

	get id(): EntityID {
		return this._id;
	}

	abstract toPrimitives(): EntityPrimitives;
}
