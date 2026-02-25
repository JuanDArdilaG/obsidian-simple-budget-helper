import { Service } from "../../Shared/application/service.abstract";
import { IPhysicalAssetRepository } from "../domain/physical-asset-repository.interface";
import { IPhysicalAssetService } from "../domain/physical-asset-service.interface";
import {
	PhysicalAsset,
	PhysicalAssetPrimitives,
} from "../domain/physical-asset.entity";

export class PhysicalAssetService
	extends Service<string, PhysicalAsset, PhysicalAssetPrimitives>
	implements IPhysicalAssetService
{
	constructor(_physicalAssetsRepository: IPhysicalAssetRepository) {
		super("Physical Assets", _physicalAssetsRepository);
	}
}
