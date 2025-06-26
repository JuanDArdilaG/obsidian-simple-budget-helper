import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IStoreRepository } from "contexts/Items/domain/store-repository.interface";
import { Store, StorePrimitives } from "contexts/Items/domain/store.entity";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";

export class StoresLocalRepository
	extends LocalRepository<ItemID, Store, StorePrimitives>
	implements IStoreRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.storesTableName);
	}

	protected mapToDomain(record: StorePrimitives): Store {
		return Store.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: Store): StorePrimitives {
		return entity.toPrimitives();
	}
}
