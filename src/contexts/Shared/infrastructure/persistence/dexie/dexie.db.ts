import Dexie from "dexie";
import dexieCloud from "dexie-cloud-addon";
import { DB } from "../db";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { Account } from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import { SubCategory } from "contexts/Subcategories/domain";
import { Transaction } from "contexts/Transactions/domain";
import { Item } from "contexts/Items/domain";

export class DexieDB extends DB {
	readonly db: Dexie;

	constructor() {
		super();
		this.db = new Dexie("BudgetHelper", {
			addons: [dexieCloud],
		});
		this.db.cloud.configure({
			databaseUrl: "https://zwigj72e8.dexie.cloud",
			requireAuth: true,
			tryUseServiceWorker: false,
		});
		this.#initializeTables();
	}

	async init() {
		await this.db.open();
	}

	#initializeTables() {
		this.db.version(7).stores({
			[Config.accountsTableName]: Object.keys(
				Account.emptyPrimitives()
			).join(", "),
			[Config.categoriesTableName]: Object.keys(
				Category.emptyPrimitives()
			).join(", "),
			[Config.itemsTableName]: Object.keys(Item.emptyPrimitives()).join(
				", "
			),
			[Config.subCategoriesTableName]: Object.keys(
				SubCategory.emptyPrimitives()
			).join(", "),
			[Config.transactionsTableName]: Object.keys(
				Transaction.emptyPrimitives()
			).join(", "),
		});
	}
}
