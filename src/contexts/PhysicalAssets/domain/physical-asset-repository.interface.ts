import { IRepository } from "../../Shared/domain";
import {
	PhysicalAsset,
	PhysicalAssetPrimitives,
} from "./physical-asset.entity";

export interface IPhysicalAssetRepository extends IRepository<
	string,
	PhysicalAsset,
	PhysicalAssetPrimitives
> {}
