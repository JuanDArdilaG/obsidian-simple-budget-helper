import { IBrandRepository } from "contexts/Items/domain/brand-repository.interface";
import { Brand, BrandPrimitives } from "contexts/Items/domain/brand.entity";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";

export class BrandsLocalRepository
	extends LocalRepository<ItemID, Brand, BrandPrimitives>
	implements IBrandRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.brandsTableName);
	}

	protected mapToDomain(record: BrandPrimitives): Brand {
		return Brand.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: Brand): BrandPrimitives {
		return entity.toPrimitives();
	}
}
