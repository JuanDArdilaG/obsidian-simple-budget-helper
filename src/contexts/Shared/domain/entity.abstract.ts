export type EntityComposedValue = Record<string, unknown>;

export abstract class Entity<
	EntityID,
	EntityPrimitives extends EntityComposedValue,
> {
	constructor(
		protected _id: EntityID,
		protected _updatedAt: Date,
	) {}

	get id(): EntityID {
		return this._id;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}

	protected updateTimestamp(): void {
		this._updatedAt = new Date();
	}

	abstract toPrimitives(): EntityPrimitives;
}
