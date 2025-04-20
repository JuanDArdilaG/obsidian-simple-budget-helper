import { ValueObject } from "../domain";
import { Entity } from "../domain/entity.abstract";

export class Logger {
	private static _debugMode: boolean = false;
	constructor(
		private _name: string = "Logger",
		private _title: string = "",
		private _body: Record<string, any> = {}
	) {}

	static setDebugMode(debugMode: boolean) {
		Logger._debugMode = debugMode;
	}

	setName(name: string) {
		this._name = name;
	}

	debug(title: string, body?: Record<string, any>) {
		if (!Logger._debugMode) return;
		console.log({
			_title: `${this._name}: ${title}`,
			...this.#mapBody(body),
		});
	}

	error(title: string, body?: Record<string, any>) {
		console.error({
			_title: `${this._name}: ${title}`,
			...this.#mapBody(body),
		});
	}

	debugB(title: string, body?: Record<string, any>): this {
		this._title = title;
		this._body = body ?? {};
		return this;
	}

	title(t: string): this {
		this._title = t;
		return this;
	}

	attr(n: string, v: any): this {
		this._body[n] = v;
		return this;
	}

	obj(o: Record<string, any>): this {
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

	#mapBody(body?: Record<string, any>): Record<string, any> {
		const res: Record<string, any> = {};
		if (body)
			Object.keys(body).forEach(
				(key) =>
					(res[key] = Array.isArray(body[key])
						? body[key].map((x) => this.#mapValue(x))
						: this.#mapValue(body[key]))
			);

		return res;
	}

	#mapValue(value: any): any {
		if (value instanceof ValueObject) return value.value;
		if (value instanceof Entity) return value.toPrimitives();
		return value ? value.valueOf() : value;
	}
}
