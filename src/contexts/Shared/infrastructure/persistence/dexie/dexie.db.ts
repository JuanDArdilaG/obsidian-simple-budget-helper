import Dexie from "dexie";
import { DB } from "../db";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { Account } from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import { Item, SimpleItem } from "contexts/SimpleItems/domain";
import { SubCategory } from "contexts/Subcategories/domain";
import { Transaction } from "contexts/Transactions/domain";
import { ScheduledItem } from "contexts/ScheduledItems/domain";

export class DexieDB extends DB {
	readonly db: Dexie;

	constructor(readonly config: typeof Config) {
		super();
		this.db = new Dexie(config.dbName, {
			chromeTransactionDurability: "strict",
		});
		this.#initializeTables();
		this.db.open();
	}

	#initializeTables() {
		this.db.version(5).stores({
			[this.config.accountsTableName]: Object.keys(
				Account.emptyPrimitives()
			).join(", "),
			[this.config.categoriesTableName]: Object.keys(
				Category.emptyPrimitives()
			).join(", "),
			[this.config.simpleItemsTableName]: Object.keys(
				SimpleItem.emptyPrimitives()
			).join(", "),
			["items"]: Object.keys(SimpleItem.emptyOldPrimitives()).join(", "),
			[this.config.scheduledItemsTableName]: Object.keys(
				ScheduledItem.emptyPrimitives()
			).join(", "),
			[this.config.subCategoriesTableName]: Object.keys(
				SubCategory.emptyPrimitives()
			).join(", "),
			[this.config.transactionsTableName]: Object.keys(
				Transaction.emptyPrimitives()
			).join(", "),
		});
	}

	async query(
		q: string,
		params?: Record<string, string | number | null>
	): Promise<any> {}
}
