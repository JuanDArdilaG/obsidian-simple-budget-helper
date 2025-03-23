import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { IDValueObject } from "contexts/Shared/domain/value-objects/id/id.valueobject";
import { SQLiteDB } from "./sqlite.db";
import { Logger } from "../../logger";
import { Criteria } from "contexts/Shared/domain/criteria";
import { IEntity } from "contexts/Shared/domain";

export abstract class SQLiteRepository<
	ID extends IDValueObject,
	T extends IEntity<ID, P>,
	P extends Record<string, string | number | Date>
> implements IRepository<ID, T, P>
{
	constructor(
		protected readonly _db: SQLiteDB,
		protected readonly _tableName: string,
		protected readonly _idColumn: string = "id"
	) {}

	/**
	 * Find entity by ID
	 */
	async findById(id: ID): Promise<T | null> {
		const query = `
        SELECT * FROM ${this._tableName}
        WHERE ${this._idColumn} = @id
      `;

		const result = await this._db.query(query, { id: id.toString() });
		Logger.debug("sqlite result", { result });

		if (result.rows.length === 0) {
			return null;
		}

		return this.mapToDomain(result.rows[0]);
	}

	/**
	 * Find all entities
	 */
	async findAll(): Promise<T[]> {
		const query = `SELECT * FROM ${this._tableName}`;
		const result = await this._db.query(query);
		return result.rows.map((row: any) => this.mapToDomain(row));
	}

	async findByCriteria(criteria: Criteria<P>): Promise<T[]> {
		throw new Error("not implemented");
	}

	/**
	 * Save entity (create or update)
	 * This is an abstract method since the implementation
	 * depends on the specific entity structure
	 */
	abstract persist(entity: T): Promise<void>;

	/**
	 * Delete entity by ID
	 */
	async deleteById(id: ID): Promise<boolean> {
		const query = `
        DELETE FROM ${this._tableName}
        WHERE ${this._idColumn} = @id
      `;

		const result = await this._db.query(query, { id: id.toString() });
		return result.rowCount > 0;
	}

	/**
	 * Check if entity exists
	 */
	async exists(id: ID): Promise<boolean> {
		const query = `
        SELECT 1 FROM ${this._tableName}
        WHERE ${this._idColumn} = @id
      `;

		const result = await this._db.query(query, { id: id.toString() });
		return result.rows.length > 0;
	}

	/**
	 * Map a database record to a domain entity
	 * Must be implemented by subclasses
	 */
	protected abstract mapToDomain(record: any): T;
}
