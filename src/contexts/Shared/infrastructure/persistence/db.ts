export abstract class DB {
	readonly dbName: string;

	abstract query(
		q: string,
		params?: Record<string, string | number | null>
	): Promise<any>;
}
