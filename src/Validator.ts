export class Validator<S, T> {
	constructor(private _schema: { [K in keyof S]: (val: T) => boolean }) {}

	validate(value: T): ValidationResult<S> {
		let result: ValidationResult<S> = new ValidationResult<S>();
		for (let key in this._schema) {
			result.set(key, this._schema[key](value));
		}

		return result;
	}

	validateAll(value: T): boolean {
		return Object.keys(this._schema)
			.map((key) => key as keyof S)
			.every((key) => this._schema[key](value));
	}

	getAllTrue(): ValidationResult<S> {
		let result: ValidationResult<S> = new ValidationResult<S>();
		for (let key in this._schema) {
			result.set(key, true);
		}
		return result;
	}
}

export class ValidationResult<S> {
	private _schema: { [K in keyof S]: boolean } = {} as {
		[K in keyof S]: boolean;
	};

	set(key: keyof S, value: boolean) {
		this._schema[key] = value;
	}

	check(key: keyof S): string {
		return this._schema[key] ? "" : "required";
	}

	toJSON(): { [K in keyof S]: boolean } {
		return this._schema;
	}

	validate(): boolean {
		return Object.keys(this._schema)
			.map((key) => key as keyof S)
			.every((key) => this._schema[key]);
	}
}
