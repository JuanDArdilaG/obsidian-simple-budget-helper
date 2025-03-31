import { ValueObject as LibValueObject } from "@juandardilag/value-objects/ValueObject";
import { ValueObject } from "../domain";
import { Entity } from "../domain/entity.abstract";
import { Config } from "./config/config";

export class Logger {
	constructor(
		readonly name: string,
		private _title: string = "",
		private _body: Record<string, any> = {}
	) {}

	debug(title: string, body?: Record<string, any>) {
		if (!Config.debug) return;
		console.log({
			_title: `${this.name}: ${title}`,
			...this.#mapBody(body),
		});
	}

	debugB(title: string, body?: Record<string, any>): Logger {
		this._title = title;
		this._body = body ?? {};
		return this;
	}

	title(t: string): Logger {
		this._title = t;
		return this;
	}

	attr(n: string, v: any): Logger {
		this._body[n] = v;
		return this;
	}

	obj(o: Record<string, any>): Logger {
		this._body = { ...this._body, ...o };
		return this;
	}

	log() {
		if (!Config.debug) return;
		console.log({
			_title: `${this.name}: ${this._title}`,
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
		return value instanceof ValueObject
			? value.value
			: value instanceof LibValueObject
			? value.valueOf()
			: value instanceof Entity
			? value.toPrimitives()
			: value;
	}
}
