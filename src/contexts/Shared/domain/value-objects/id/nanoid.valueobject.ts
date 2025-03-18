import { IDValueObject } from "./id.valueobject";
import { InvalidArgumentError } from "../../errors/invalid-argument.error";
import { nanoid } from "nanoid";

export class Nanoid extends IDValueObject {
	constructor(private _name: string, value: string) {
		super(value);
		this.validate();
	}

	validate(): void {
		if (this.value.length !== 21)
			throw new InvalidArgumentError(
				this._name,
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
