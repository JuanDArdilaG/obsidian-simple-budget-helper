import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { Item, ItemPrimitives } from "contexts/Items/domain/item.entity";
import { RecurrentItem } from "contexts/Items/domain/RecurrentItem/recurrent-item.entity";
import { SimpleItem } from "contexts/Items/domain/simple-item.entity";
import { SQLiteDB } from "contexts/Shared/infrastructure/persistence/sqlite/sqlite.db";
import { SQLiteRepository } from "contexts/Shared/infrastructure/persistence/sqlite/sqlite.repository";

export class ItemsSQLiteRepository extends SQLiteRepository<
	ItemID,
	Item,
	ItemPrimitives
> {
	constructor(_db: SQLiteDB) {
		super(_db, "items");
		_db.query(`CREATE TABLE IF NOT EXISTS ${this._tableName} (
            id TEXT PRIMARY KEY,
            operation TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            subCategory TEXT NOT NULL,
            brand TEXT,
            store TEXT,
            account TEXT NOT NULL,
            toAccount TEXT,
            nextDate TEXT,
            frequency TEXT
        )`);

		this._db.query(
			`CREATE INDEX IF NOT EXISTS idx_${this._tableName}_category ON ${this._tableName}(category)`
		);
		this._db.query(
			`CREATE INDEX IF NOT EXISTS idx_${this._tableName}_account ON ${this._tableName}(account)`
		);
	}

	async persist(item: Item): Promise<void> {
		const query = `
        INSERT INTO ${this._tableName}(
            id, operation, name, amount, category, subCategory, brand, store, account, toAccount, nextDate, frequency
        ) VALUES(
            @id, @operation, @name, @amount, @category, @subCategory, @brand, @store, @account, @toAccount, @nextDate, @frequency
        )
        `;

		const res = await this._db.query(query, {
			frequency: null,
			...item.toPrimitives(),
			nextDate: RecurrentItem.IsRecurrent(item)
				? String(item.nextDate.valueOf().getTime())
				: null,
		});
		console.log(res);
	}

	protected mapToDomain(record: any): Item {
		return record.nextDate
			? RecurrentItem.fromPrimitives({
					...record,
					nextDate: new Date(Number(record.nextDate)),
			  })
			: SimpleItem.fromPrimitives(record);
	}
}
