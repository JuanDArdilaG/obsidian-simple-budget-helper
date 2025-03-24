export class Logger {
	constructor(readonly name: string) {}

	debug(title: string, body?: Record<string, any>, config?: { on: boolean }) {
		if (config && config.on === false) return;
		console.log({ _title: `${this.name}: ${title}`, ...body });
	}
}
