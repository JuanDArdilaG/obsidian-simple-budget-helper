import { IDValueObject } from "./value-objects/id/id.valueobject";

export interface IEntity<
	EntityID extends IDValueObject,
	EntityPrimitives extends Record<string, string | number | Date>
> {
	get id(): EntityID;

	toPrimitives(): EntityPrimitives;
}
