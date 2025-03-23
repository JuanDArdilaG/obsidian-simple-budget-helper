import { ValueObject } from "contexts/Shared/domain/value-objects/value-object";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";

export type StringLengthOptions = {
	minLength: number;
	maxLength: number;
};

export const StringLengthOptionsDefault: StringLengthOptions = {
	minLength: 1,
	maxLength: 1000,
};

export class StringValueObject extends ValueObject<string> {
	constructor(
		protected _name: string,
		value: string,
		private _length: StringLengthOptions = StringLengthOptionsDefault
	) {
		super(value);
		this.validate();
	}

	validate(): void {
		if (typeof this.value !== "string")
			throw new InvalidArgumentError(
				this._name,
				this.value,
				"must be a string"
			);

		if (
			this.value.length > this._length.maxLength ||
			this.value.length < this._length.minLength
		)
			throw new InvalidArgumentError(
				this._name,
				this.value,
				`Invalid string length. min: ${this._length.minLength}, max: ${this._length.maxLength}`
			);
	}

	static empty(): StringValueObject {
		return new StringValueObject("", "");
	}

	toString(): string {
		return this.value;
	}

	equalTo(other: StringValueObject): boolean {
		return this.value === other.value;
	}
}
