import { Criteria } from "../criteria";
import { Entity, EntityComposedValue } from "../entity.abstract";
import { IDValueObject } from "../value-objects/id/id.valueobject";

/**
 * Generic repository interface that defines common operations
 * for domain entities
 */
export interface IRepository<
	ID extends IDValueObject,
	T extends Entity<ID, P>,
	P extends EntityComposedValue
> {
	/**
	 * Find entity by its ID
	 * @param id Entity identifier
	 * @returns The entity if found, null otherwise
	 */
	findById(id: ID): Promise<T | null>;

	/**
	 * Find all entities
	 * @returns Array of all entities
	 */
	findAll(): Promise<T[]>;

	/**
	 * Find entities that match the criteria
	 * @returns Array of entities found
	 */
	findByCriteria(criteria: Criteria<P>): Promise<T[]>;

	/**
	 * Save an entity (create or update)
	 * @param entity The entity to save
	 * @returns The saved entity
	 */
	persist(entity: T): Promise<void>;

	/**
	 * Delete an entity by ID
	 * @param id Entity identifier
	 * @returns True if deleted, false if not found
	 */
	deleteById(id: ID): Promise<boolean>;

	/**
	 * Check if an entity exists
	 * @param id Entity identifier
	 * @returns True if exists, false otherwise
	 */
	exists(id: ID): Promise<boolean>;
}

/**
 * Extended repository interface with pagination support
 */
export interface IPaginatedRepository<
	ID extends IDValueObject,
	T extends Entity<ID, P>,
	P extends EntityComposedValue
> extends IRepository<ID, T, P> {
	/**
	 * Find entities with pagination
	 * @param page Page number (0-based)
	 * @param size Page size
	 * @returns Paginated result with entities and metadata
	 */
	findPaginated(page: number, size: number): Promise<PaginationResult<T>>;
}

/**
 * Pagination result structure
 */
export interface PaginationResult<T> {
	items: T[];
	total: number;
	page: number;
	size: number;
	pages: number;
	hasNext: boolean;
	hasPrev: boolean;
}
