import { IRepository } from "contexts/Shared/domain";
import { Brand, BrandPrimitives } from "./brand.entity";
import { ItemID } from "./item-id.valueobject";

export interface IBrandRepository
	extends IRepository<ItemID, Brand, BrandPrimitives> {}
