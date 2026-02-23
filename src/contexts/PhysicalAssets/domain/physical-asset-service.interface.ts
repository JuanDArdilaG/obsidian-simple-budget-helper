import { IService } from "../../Shared/domain";
import {
	PhysicalAsset,
	PhysicalAssetPrimitives,
} from "./physical-asset.entity";

export interface IPhysicalAssetService extends IService<
	string,
	PhysicalAsset,
	PhysicalAssetPrimitives
> {}
