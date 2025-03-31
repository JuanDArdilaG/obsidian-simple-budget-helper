import {
	Entity,
	EntityComposedValue,
	EntityNotFoundError,
	IDValueObject,
	IRepository,
} from "../domain";

export abstract class Service<
	ID extends IDValueObject,
	T extends Entity<ID, P>,
	P extends EntityComposedValue
> {
	constructor(
		private _entityName: string,
		private _repository: IRepository<ID, T, P>
	) {}

	async getByID(id: ID): Promise<T> {
		const entity = await this._repository.findById(id);
		if (!entity) throw new EntityNotFoundError("Scheduled Item", id);
		return entity;
	}

	async getAll(): Promise<T[]> {
		return await this._repository.findAll();
	}

	async update(item: T): Promise<void> {
		const exists = await this._repository.exists(item.id);
		if (!exists) throw new EntityNotFoundError(this._entityName, item.id);
		await this._repository.persist(item);
	}

	async delete(id: ID): Promise<void> {
		const exists = await this._repository.exists(id);
		if (!exists) throw new EntityNotFoundError("Scheduled Item", id);
		await this._repository.deleteById(id);
	}
}
