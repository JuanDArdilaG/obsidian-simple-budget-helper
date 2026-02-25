import { DomainError } from "contexts/Shared/domain/errors/domain-error";

export class InvalidArgumentError extends DomainError {
	constructor(entityName: string, value: string | number, reason: string) {
		super(
			`${entityName} with value '${
				value ?? ""
			}' is invalid. Reason: ${reason}`,
		);
	}

	public errorType(): string {
		return "INVALID_ARGUMENT";
	}
}
