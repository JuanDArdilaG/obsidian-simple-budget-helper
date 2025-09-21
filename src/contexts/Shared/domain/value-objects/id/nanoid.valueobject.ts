import { IDValueObject } from "contexts/Shared/domain/value-objects/id";
import { nanoid } from "nanoid";
import { InvalidArgumentError } from "contexts/Shared/domain/errors";

export class Nanoid extends IDValueObject {
	constructor(name: string, value: string) {
		super(value, { minLength: 21, maxLength: 21 });
		this.validate();
	}

	validate(): void {
		if (this.value.length !== 21)
			throw new InvalidArgumentError(
				"nanoid",
				this.value,
				"invalid nanoid"
			);
	}

	toString(): string {
		return this.value;
	}

	static generate(name: string): Nanoid {
		return new Nanoid(name, nanoid());
	}
}
