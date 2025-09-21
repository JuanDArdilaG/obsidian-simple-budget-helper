import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IProviderRepository } from "contexts/Items/domain/provider-repository.interface";
import {
	Provider,
	ProviderPrimitives,
} from "contexts/Items/domain/provider.entity";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";

export class ProvidersLocalRepository
	extends LocalRepository<ItemID, Provider, ProviderPrimitives>
	implements IProviderRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.providersTableName);
	}

	protected mapToDomain(record: ProviderPrimitives): Provider {
		return Provider.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: Provider): ProviderPrimitives {
		return entity.toPrimitives();
	}
}
