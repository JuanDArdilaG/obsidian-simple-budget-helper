import { StringValueObject as LibStringValueObject } from "@juandardilag/value-objects";
import { DomainError } from "../errors";
import { StringValueObject } from "../value-objects";

export class EntityNotFoundError extends DomainError {
	constructor(
		entityName: string,
		id: LibStringValueObject | StringValueObject
	) {
		super(`${entityName} with id ${id} not found`);
	}

	public errorType(): string {
		return "ENTITY_NOT_FOUND";
	}
}
