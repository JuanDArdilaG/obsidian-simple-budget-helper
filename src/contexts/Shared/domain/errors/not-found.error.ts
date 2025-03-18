import { IDValueObject } from "../value-objects/id/id.valueobject";
import { DomainError } from "./domain-error";

export class EntityNotFoundError extends DomainError {
	constructor(entityName: string, id: IDValueObject) {
		super(`${entityName} with id ${id.toString()} not found`);
	}

	public errorType(): string {
		return "ENTITY_NOT_FOUND";
	}
}
