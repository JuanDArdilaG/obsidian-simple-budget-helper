import Database, { Database as DatabaseType } from "better-sqlite3";
import { Logger } from "../../logger";
import { DB } from "../db";

const logger = new Logger("SQLiteDB");

export class SQLiteDB implements DB {
	private _db: DatabaseType;
	constructor(readonly dbName: string) {
		this._db = new Database(`${dbName}.sqlite`);
	}

	query(q: string, params: Record<string, string | number | null> = {}): any {
		logger.debug("sqlite query", { q, params });
		const p = this._db.prepare(q);
		return p.run(params);
	}
}
