import { StringValueObject, DomainError } from "contexts/Shared/domain";

export class EntityNotFoundError extends DomainError {
	constructor(entityName: string, id: StringValueObject) {
		super(`${entityName} with id ${id.toString()} not found`);
	}

	public errorType(): string {
		return "ENTITY_NOT_FOUND";
	}
}
