import { Criteria } from "./criteria";
import { Entity, EntityComposedValue } from "./entity.abstract";
import { IDValueObject } from "./value-objects";

export interface IService<
	ID extends IDValueObject,
	T extends Entity<ID, P>,
	P extends EntityComposedValue
> {
	exists(id: ID): Promise<boolean>;
	create(item: T): Promise<void>;
	getByID(id: ID): Promise<T>;
	getByCriteria(criteria: Criteria<P>): Promise<T[]>;
	getAll(): Promise<T[]>;
	update(item: T): Promise<void>;
	delete(id: ID): Promise<void>;
}
