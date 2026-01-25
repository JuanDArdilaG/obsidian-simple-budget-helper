import {
	Criteria,
	Entity,
	EntityComposedValue,
	EntityNotFoundError,
	InvalidArgumentError,
	IRepository,
} from "../domain";
import { IService } from "../domain/service.interface";
import { Logger } from "../infrastructure/logger";

export abstract class Service<
	ID extends string | number,
	T extends Entity<ID, P>,
	P extends EntityComposedValue,
> implements IService<ID, T, P> {
	readonly #logger = new Logger("ServiceAbstract");
	constructor(
		private readonly _entityName: string,
		private readonly _repository: IRepository<ID, T, P>,
	) {}

	async exists(id: ID): Promise<boolean> {
		return await this._repository.exists(id);
	}

	async create(item: T): Promise<void> {
		if (await this._repository.exists(item.id))
			throw new InvalidArgumentError(
				this._entityName,
				item.id,
				`${this._entityName} with id ${item.id} already exists`,
			);
		await this._repository.persist(item);
	}

	async getByID(id: ID): Promise<T> {
		const entity = await this._repository.findById(id);
		if (!entity) throw new EntityNotFoundError("Scheduled Item", id);
		return entity;
	}

	async getByCriteria(criteria: Criteria<P>): Promise<T[]> {
		return await this._repository.findByCriteria(criteria);
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
		this.#logger.debug(
			`Deleting ${this._entityName} with id ${id}, exists: ${exists}`,
		);
		if (!exists) throw new EntityNotFoundError(this._entityName, id);
		await this._repository.deleteById(id);
	}
}
