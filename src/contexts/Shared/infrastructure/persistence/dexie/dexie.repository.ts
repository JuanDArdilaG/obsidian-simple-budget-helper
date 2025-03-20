import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { IDValueObject } from "contexts/Shared/domain/value-objects/id/id.valueobject";
import { Criteria } from "contexts/Shared/domain/criteria";
import { DexieDB } from "./dexie.db";
import { IEntity } from "contexts/Shared/domain/entity.interface";
import { EntityTable } from "dexie";

export abstract class DexieRepository<
	T extends IEntity<ID, EntityPrimitives>,
	ID extends IDValueObject,
	EntityPrimitives extends Record<string, string | number | Date>
> implements IRepository<ID, T>
{
	protected readonly _table: EntityTable<EntityPrimitives, "id">;

	constructor(
		protected readonly _db: DexieDB,
		protected readonly _tableName: string,
		protected readonly _idColumn: string = "id"
	) {
		const table = this._db.db.tables.find(
			(table) => table.name === _tableName
		);
		if (!table)
			throw new Error(`table with name ${_tableName} doesn't exists`);
		this._table = table;
	}

	/**
	 * Find entity by ID
	 */
	async findById(id: ID): Promise<T | null> {
		return this.mapToDomain(
			(await this._table.where("id").equals(id.toString()).toArray())[0]
		);
	}

	/**
	 * Find all entities
	 */
	async findAll(): Promise<T[]> {
		return (await this._table.toArray()).map((i) => this.mapToDomain(i));
	}

	async findByCriteria(criteria: Criteria<T>): Promise<T[]> {
		//TODO: real implementation, actually just returns all
		return (await this._table.toArray()).map((i) => this.mapToDomain(i));
	}

	/**
	 * Save entity (create or update)
	 * This is an abstract method since the implementation
	 * depends on the specific entity structure
	 */
	async persist(entity: T): Promise<void> {
		const exists = await this.exists(entity.id);
		if (!exists) {
			await this._table.add(entity.toPrimitives());
		} else {
			await this._table.update(
				entity.id.toString(),
				entity.toPrimitives()
			);
		}
	}

	/**
	 * Delete entity by ID
	 */
	async deleteById(id: ID): Promise<boolean> {
		await this._table.delete(id.toString());
		return true;
	}

	/**
	 * Check if entity exists
	 */
	async exists(id: ID): Promise<boolean> {
		try {
			return (
				(await this._table.where("id").equals(id.toString()).count()) >=
				1
			);
		} catch (_) {
			return false;
		}
	}

	/**
	 * Map a database record to a domain entity
	 * Must be implemented by subclasses
	 */
	protected abstract mapToDomain(
		record: Record<string, string | number | Date>
	): T;
}
