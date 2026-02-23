import { Config } from "../../Shared/infrastructure/config/config";
import { LocalDB } from "../../Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "../../Shared/infrastructure/persistence/local/local.repository";
import { IPhysicalAssetRepository } from "../domain/physical-asset-repository.interface";
import {
	PhysicalAsset,
	PhysicalAssetPrimitives,
} from "../domain/physical-asset.entity";

export class PhysicalAssetDexieRepository
	extends LocalRepository<string, PhysicalAsset, PhysicalAssetPrimitives>
	implements IPhysicalAssetRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.physicalAssetsTableName);
	}
	protected mapToDomain(record: PhysicalAssetPrimitives): PhysicalAsset {
		return PhysicalAsset.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: PhysicalAsset): PhysicalAssetPrimitives {
		return entity.toPrimitives();
	}
}
