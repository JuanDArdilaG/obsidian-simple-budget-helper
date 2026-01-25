import { StringValueObject } from "@juandardilag/value-objects";
import { DomainError } from "../errors";

export class EntityNotFoundError extends DomainError {
	constructor(entityName: string, id: string | number | StringValueObject) {
		super(`${entityName} with id ${id} not found`);
	}

	public errorType(): string {
		return "ENTITY_NOT_FOUND";
	}
}
