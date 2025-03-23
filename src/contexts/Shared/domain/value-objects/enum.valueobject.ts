import { InvalidArgumentError } from "contexts/Shared/domain/errors";
import { ValueObject } from "contexts/Shared/domain/value-objects/value-object";

export abstract class EnumValueObject<T> extends ValueObject<T> {
	constructor(
		private _name: string,
		private _values: T[],
		private _toString: (_: T) => string,
		value: T
	) {
		super(value);
		this.validate();
	}

	validate() {
		if (
			!this._values.some(
				(item) => this._toString(item) === this._toString(this.value)
			)
		) {
			throw new InvalidArgumentError(
				this._name,
				this._toString(this.value),
				"invalid value"
			);
		}
	}

	toString(): string {
		return this._toString(this.value);
	}
}
