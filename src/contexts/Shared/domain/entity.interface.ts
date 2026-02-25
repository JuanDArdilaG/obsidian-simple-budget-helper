export interface IEntity<
	EntityID extends string | number,
	EntityPrimitives extends Record<string, string | number | Date>,
> {
	get id(): EntityID;

	toPrimitives(): EntityPrimitives;
}
