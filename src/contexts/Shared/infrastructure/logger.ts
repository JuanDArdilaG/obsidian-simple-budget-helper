import {
	DateValueObject,
	NumberValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { Entity, EntityComposedValue } from "../domain/entity.abstract";
import { IDValueObject } from "../domain";

type LoggerBodyValues =
	| StringValueObject
	| NumberValueObject
	| DateValueObject
	| Entity<IDValueObject, EntityComposedValue>
	| string
	| number
	| Date
	| boolean
	| object
	| undefined;

type LoggerBody = {
	[k: string]: LoggerBodyValues | LoggerBodyValues[];
};

type LoggerBodyMappedValues =
	| string
	| number
	| Date
	| object
	| boolean
	| EntityComposedValue
	| undefined;

type LoggerBodyMapped =
	| {
			[k: string]: LoggerBodyMappedValues | LoggerBodyMappedValues[];
	  }
	| EntityComposedValue;

export class Logger {
	private static _debugMode: boolean = false;
	constructor(
		private _name: string = "Logger",
		private _title: string = "",
		private _body: LoggerBody = {}
	) {}

	static setDebugMode(debugMode: boolean) {
		Logger._debugMode = debugMode;
	}

	setName(name: string) {
		this._name = name;
	}

	debug(title: string, body?: LoggerBody) {
		if (!Logger._debugMode) return;
		console.log({
			_title: `${this._name}: ${title}`,
			...this.#mapBody(body),
		});
	}

	error(title: string, body?: LoggerBody) {
		console.error({
			_title: `${this._name}: ${title}`,
			...this.#mapBody(body),
		});
	}

	debugB(title: string, body?: LoggerBody): this {
		this._title = title;
		this._body = body ?? {};
		return this;
	}

	title(t: string): this {
		this._title = t;
		return this;
	}

	obj(o: LoggerBody): this {
		this._body = { ...this._body, ...o };
		return this;
	}

	log() {
		if (!Logger._debugMode) return;
		console.log({
			_title: `${this._name}: ${this._title}`,
			...this.#mapBody(this._body),
		});
		this._title = "";
		this._body = {};
	}

	#mapBody(body?: LoggerBody): LoggerBodyMapped | LoggerBodyMappedValues[] {
		const res: LoggerBodyMapped = {};
		if (body)
			Object.keys(body).forEach(
				(key) =>
					(res[key] = Array.isArray(body[key])
						? body[key].map((x) => this.#mapValue(x))
						: this.#mapValue(body[key]))
			);

		return res;
	}

	#mapValue(value: LoggerBodyValues): LoggerBodyMappedValues {
		if (value === undefined) return undefined;
		if (
			value instanceof StringValueObject ||
			value instanceof NumberValueObject ||
			value instanceof DateValueObject
		)
			return value.value;
		if (value instanceof Entity) return value.toPrimitives();
		if (value instanceof Date) return value;
		return value;
	}
}
