import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { Nanoid } from "../../../Shared/domain";
import { IStoreRepository, Store, StorePrimitives } from "../../domain";

export class StoresLocalRepository
	extends LocalRepository<Nanoid, Store, StorePrimitives>
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
