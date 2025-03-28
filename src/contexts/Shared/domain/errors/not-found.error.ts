import { DomainError } from "contexts/Shared/domain";

export class EntityNotFoundError extends DomainError {
	constructor(entityName: string, id: string) {
		super(`${entityName} with id ${id} not found`);
	}

	public errorType(): string {
		return "ENTITY_NOT_FOUND";
	}
}
