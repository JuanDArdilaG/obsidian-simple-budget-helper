import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { IDValueObject } from "contexts/Shared/domain/value-objects/id/id.valueobject";
import { Criteria } from "contexts/Shared/domain/criteria";
import { DexieDB } from "./dexie.db";
import { EntityTable } from "dexie";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { Entity, EntityComposedValue } from "contexts/Shared/domain";

export abstract class DexieRepository<
	T extends Entity<ID, P>,
	ID extends IDValueObject,
	P extends EntityComposedValue
> implements IRepository<ID, T, P>
{
	readonly #logger = new Logger("DexieRepository");
	protected readonly _table: EntityTable<P, "id">;

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

	async findByCriteria(criteria: Criteria<P>): Promise<T[]> {
		const table = this._table;
		this.#logger.debug("findByCriteria dexie repository", {
			criteria,
		});
		let collection = table.toCollection();
		Object.keys(criteria.filters).forEach((field) => {
			const filter = criteria.filters[field];
			this.#logger.debug("new filter", {
				filter: `where ${field} ${filter.operator} ${filter.value}`,
			});
			collection = collection.and((p) => {
				const value = p[field];

				if (filter.operator === "EQUAL") return value === filter.value;
				if (filter.operator === "NOT_EQUAL")
					return value !== filter.value;

				if (filter.value && value) {
					if (filter.operator === "GREATER_THAN")
						return value > filter.value;
					if (filter.operator === "GREATER_THAN_OR_EQUAL")
						return value >= filter.value;
					if (filter.operator === "LESS_THAN")
						return value < filter.value;
					if (filter.operator === "LESS_THAN_OR_EQUAL")
						return value <= filter.value;
				}

				return false;
			});
		});
		const res = await collection.toArray();
		this.#logger.debug("findByCriteria res", { res });
		return res.map((i) => this.mapToDomain(i));
	}

	/**
	 * Save entity (create or update)
	 */
	async persist(entity: T): Promise<void> {
		const exists = await this.exists(entity.id);
		if (!exists) {
			await this._table.add(entity.toPrimitives());
		} else {
			await this._table.update(
				//@ts-ignore
				entity.id.value,
				entity.toPrimitives()
			);
		}
	}

	/**
	 * Delete entity by ID
	 */
	async deleteById(id: ID): Promise<boolean> {
		await this._table.delete(
			//@ts-ignore
			id.toString()
		);
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
	protected abstract mapToDomain(record: EntityComposedValue): T;
}
