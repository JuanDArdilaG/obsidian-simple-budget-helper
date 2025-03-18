import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { Subcategory } from "./subcategory.entity";
import { SubcategoryID } from "./subcategory-id.valueobject";
import { SubcategoryName } from "./subcategory-name.valueobject";

export interface ISubcategoriesRepository
	extends IRepository<Subcategory, SubcategoryID> {
	findAllNames(): Promise<SubcategoryName[]>;
}
