export class Logger {
	static debug(
		this: any,
		title: string,
		body: Record<string, any>,
		config?: { on: boolean }
	) {
		if (config && !config.on) return;
		console.log({ _title: title, ...body });
	}
}
