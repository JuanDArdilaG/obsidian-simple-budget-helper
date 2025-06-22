import Dexie from "dexie";
import dexieCloud from "dexie-cloud-addon";
import { DB } from "../db";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { Account } from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import { SubCategory } from "contexts/Subcategories/domain";
import { Transaction } from "contexts/Transactions/domain";
import { Item } from "contexts/Items/domain";
import { Logger } from "../../logger";

export class DexieDB extends DB {
	db: Dexie;
	logger: Logger = new Logger("DexieDB");

	constructor() {
		super();
	}

	async init(dbId: string) {
		try {
			this.logger.debug("initializing dexie");
			this.db = new Dexie(`BudgetHelper-${dbId}`, {
				addons: [dexieCloud],
			});
			this.logger.debug("configuring dexie");

			this.db.cloud.configure({
				databaseUrl: "https://zwigj72e8.dexie.cloud",
				requireAuth: true,
				// periodicSync: { minInterval: 60 },
			});
			this.logger.debug("initializing tables");
			this.#initializeTables();

			this.logger.debug("opening db");
			await this.db.open();

			// const path = normalizePath("Budget/db/sync.backup");
			// this.logger.debug("loading backup", { path });
			// const buffer = await app.vault.adapter.readBinary(path);

			// this.logger.debug("importing backup");
			// await importInto(this.db, new Blob([buffer]), {
			// 	clearTablesBeforeImport: true,
			// 	acceptNameDiff: true,
			// 	acceptVersionDiff: true,
			// });

			this.logger.debug("pulling sync");
			this.db.cloud.sync({ wait: false, purpose: "pull" });
		} catch (error) {
			this.logger.error(error);
		}

		// const blob = await exportDB(oldDb);
		// await importInto(this.db, blob, {
		// 	acceptNameDiff: true,
		// 	acceptVersionDiff: true,
		// });
		// this.db.import(blob, {
		// 	acceptNameDiff: true,
		// 	acceptVersionDiff: true,
		// });
	}

	#initializeTables() {
		this.db.version(1).stores({
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
