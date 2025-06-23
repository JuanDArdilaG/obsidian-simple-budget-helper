import {
	Criteria,
	Entity,
	EntityComposedValue,
	IDValueObject,
} from "contexts/Shared/domain";
import { IRepository } from "../../../../src/contexts/Shared/domain/persistence/repository.interface";

export class RepositoryMock<
	ID extends IDValueObject,
	T extends Entity<ID, P>,
	P extends EntityComposedValue
> implements IRepository<ID, T, P>
{
	constructor(public items: T[]) {}

	async findById(id: ID): Promise<T | null> {
		return this.items.find((t) => t.id.equalTo(id)) ?? null;
	}

	async findAll(): Promise<T[]> {
		return this.items;
	}

	async findByCriteria(criteria: Criteria<P>): Promise<T[]> {
		return this.items;
	}

	async persist(entity: T): Promise<void> {
		const i = this.items.findIndex((t) => t.id.equalTo(entity.id));
		if (i === -1) {
			this.items.push(entity);
		} else {
			this.items[i] = entity;
		}
	}

	async deleteById(id: ID): Promise<boolean> {
		const index = this.items.findIndex((t) => t.id.equalTo(id));
		if (index > -1) {
			this.items.splice(index, 1);
			return true;
		}
		return false;
	}

	async exists(id: ID): Promise<boolean> {
		return this.items.some((t) => t.id.equalTo(id));
	}
}
