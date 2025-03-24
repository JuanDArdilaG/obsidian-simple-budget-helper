export class Logger {
	constructor(
		readonly name: string,
		private _title: string = "",
		private _body: Record<string, any> = {},
		private _on: boolean = true
	) {}

	debug(title: string, body?: Record<string, any>, config?: { on: boolean }) {
		if (!this._on || (config && config.on === false)) return;
		console.log({ _title: `${this.name}: ${title}`, ...body });
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

	on(): Logger {
		this._on = true;
		return this;
	}

	off(): Logger {
		this._on = false;
		return this;
	}

	log() {
		if (!this._on) return;
		console.log({ _title: `${this.name}: ${this._title}`, ...this._body });
		this._title = "";
		this._body = {};
	}
}
