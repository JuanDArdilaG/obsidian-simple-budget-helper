export interface IValueObject<T extends number> extends Object {
	valueOf(): T;
	is(o: IValueObject<T>): boolean;
}

export interface PIIOptions {
	key: string;
	iv: string;
}

export interface ValueObjectOptions {
	pii?: PIIOptions;
}

export class ValueObject<T extends number> implements IValueObject<T> {
	constructor(private _options: ValueObjectOptions, protected _value: T) {}

	get options(): ValueObjectOptions {
		return this._options;
	}

	static from<T extends number>(other: ValueObject<T>): ValueObject<T> {
		return new ValueObject<T>(other._options, other.valueOf());
	}

	valueOf(): T {
		return this._value;
	}

	is(o: IValueObject<T>): boolean {
		return this._value === o.valueOf();
	}

	toString(): string {
		return this._value.toString();
	}

	// validate(value: T) {
	// 	const validation = this._options.validator?.validate(value);
	// 	if (!this._options.validator || validation === true) return;
	// 	if (!validation)
	// 		throw new InvalidValueObjectValueError(
	// 			this.constructor.name,
	// 			"invalid value object"
	// 		);
	// 	if (validation instanceof Error) throw validation;
	// 	throw new InvalidArgumentError(this.constructor.name, value);
	// }
}
