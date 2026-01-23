import { Criteria } from "contexts/Shared/domain/criteria";
import {
	Entity,
	EntityComposedValue,
} from "contexts/Shared/domain/entity.abstract";
import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { IDValueObject } from "contexts/Shared/domain/value-objects/id/id.valueobject";
import { IndexableType } from "dexie";
import { LocalDB } from "./local.db";

export type RepositoryDependencies<
	Entities extends Entity<IDValueObject, EntityComposedValue>,
> = Map<string, Map<string, Entities>>;

export abstract class LocalRepository<
	ID extends IDValueObject,
	T extends Entity<ID, Primitives>,
	Primitives extends EntityComposedValue,
> implements IRepository<ID, T, Primitives> {
	protected constructor(
		protected readonly _db: LocalDB,
		protected readonly tableName: string,
		protected readonly _dependencies?: Array<{
			type: string;
			getter: () => Promise<
				Array<Entity<IDValueObject, EntityComposedValue>>
			>;
		}>,
	) {}

	protected abstract mapToDomain(
		record: Primitives,
		dependencies?: Map<
			string,
			Map<string, Entity<IDValueObject, EntityComposedValue>>
		>,
	): T;
	protected abstract mapToPrimitives(entity: T): Primitives;

	async #resolveDependencies(): Promise<
		Map<string, Map<string, Entity<IDValueObject, EntityComposedValue>>>
	> {
		const resolvedDependencies = new Map<
			string,
			Map<string, Entity<IDValueObject, EntityComposedValue>>
		>();
		if (this._dependencies) {
			for (const dependency of this._dependencies) {
				const entities = await dependency.getter();
				const entityMap = new Map<
					string,
					Entity<IDValueObject, EntityComposedValue>
				>();
				entities.forEach((entity) => {
					entityMap.set(entity.id.value, entity);
				});
				resolvedDependencies.set(dependency.type, entityMap);
			}
		}
		return resolvedDependencies;
	}

	async findById(id: ID): Promise<T | null> {
		const resolvedDependencies = await this.#resolveDependencies();
		const record = await this._db.db.table(this.tableName).get(id.value);
		return record ? this.mapToDomain(record, resolvedDependencies) : null;
	}

	async findAll(): Promise<T[]> {
		const resolvedDependencies = await this.#resolveDependencies();
		const records = await this._db.db.table(this.tableName).toArray();
		return records.map((record: Primitives) =>
			this.mapToDomain(record, resolvedDependencies),
		);
	}

	async findByCriteria(criteria: Criteria<Primitives>): Promise<T[]> {
		const resolvedDependencies = await this.#resolveDependencies();
		let records = await this._db.db.table(this.tableName).toArray();

		// Apply filters
		if (criteria.filters && Object.keys(criteria.filters).length > 0) {
			records = records.filter((record) => {
				for (const [field, filter] of Object.entries(
					criteria.filters,
				)) {
					const recordValue = record[field];
					const filterValue = filter.value;

					switch (filter.operator) {
						case "EQUAL":
							if (recordValue !== filterValue) return false;
							break;
						case "NOT_EQUAL":
							if (recordValue === filterValue) return false;
							break;
						case "GREATER_THAN":
							if (!filterValue || recordValue <= filterValue)
								return false;
							break;
						case "LESS_THAN":
							if (!filterValue || recordValue >= filterValue)
								return false;
							break;
						case "GREATER_THAN_OR_EQUAL":
							if (!filterValue || recordValue < filterValue)
								return false;
							break;
						case "LESS_THAN_OR_EQUAL":
							if (!filterValue || recordValue > filterValue)
								return false;
							break;
					}
				}
				return true;
			});
		}

		// Apply sorting
		if (criteria.orders && criteria.orders.length > 0) {
			records.sort((a, b) => {
				for (const order of criteria.orders) {
					const aValue = a[order.field];
					const bValue = b[order.field];

					if (aValue < bValue)
						return order.direction === "ASC" ? -1 : 1;
					if (aValue > bValue)
						return order.direction === "ASC" ? 1 : -1;
				}
				return 0;
			});
		}

		// Apply pagination
		if (criteria.offset) {
			records = records.slice(criteria.offset);
		}

		if (criteria.limit) {
			records = records.slice(0, criteria.limit);
		}

		return records.map((record: Primitives) =>
			this.mapToDomain(record, resolvedDependencies),
		);
	}

	async persist(entity: T): Promise<void> {
		const primitives = this.mapToPrimitives(entity);
		await this._db.db.table(this.tableName).put(primitives);
		// Sync to local files after data modification
		await this._db.sync();
	}

	async deleteById(id: ID): Promise<boolean> {
		const exists = await this.exists(id);
		if (exists) {
			await this._db.db.table(this.tableName).delete(id.value);
			// Sync to local files after data modification
			await this._db.sync();
			return true;
		}
		return false;
	}

	async exists(id: ID): Promise<boolean> {
		const record = await this._db.db.table(this.tableName).get(id.value);
		return !!record;
	}

	// Additional utility methods
	async save(entity: T): Promise<void> {
		await this.persist(entity);
	}

	async update(entity: T): Promise<void> {
		await this.persist(entity);
	}

	async bulkAdd(entities: T[]): Promise<void> {
		const primitives = entities.map((entity) =>
			this.mapToPrimitives(entity),
		);
		await this._db.db.table(this.tableName).bulkAdd(primitives);
		// Sync to local files after data modification
		await this._db.sync();
	}

	async bulkPut(entities: T[]): Promise<void> {
		const primitives = entities.map((entity) =>
			this.mapToPrimitives(entity),
		);
		await this._db.db.table(this.tableName).bulkPut(primitives);
		// Sync to local files after data modification
		await this._db.sync();
	}

	async clear(): Promise<void> {
		await this._db.db.table(this.tableName).clear();
		// Sync to local files after data modification
		await this._db.sync();
	}

	// Manual sync method for explicit synchronization
	async sync(): Promise<void> {
		await this._db.sync();
	}

	// Batch operations method for efficient syncing
	async batchOperations(operations: (() => Promise<void>)[]): Promise<void> {
		for (const operation of operations) {
			await operation();
		}
		// Sync once after all operations are complete
		await this._db.sync();
	}

	async count(): Promise<number> {
		return await this._db.db.table(this.tableName).count();
	}

	async where(field: string, value: unknown): Promise<T[]> {
		const resolvedDependencies = await this.#resolveDependencies();
		const records = await this._db.db
			.table(this.tableName)
			.where(field)
			.equals(value as IndexableType)
			.toArray();
		return records.map((record: Primitives) =>
			this.mapToDomain(record, resolvedDependencies),
		);
	}

	async filter(predicate: (record: Primitives) => boolean): Promise<T[]> {
		const resolvedDependencies = await this.#resolveDependencies();
		const records = await this._db.db
			.table(this.tableName)
			.filter(predicate)
			.toArray();
		return records.map((record: Primitives) =>
			this.mapToDomain(record, resolvedDependencies),
		);
	}
}
