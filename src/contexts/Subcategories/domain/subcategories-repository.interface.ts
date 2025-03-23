import { CategoryID } from "contexts/Categories";
import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import {
	Subcategory,
	SubcategoryID,
	SubcategoryName,
	SubcategoryPrimitives,
} from "contexts/Subcategories/domain";

export interface ISubCategoriesRepository
	extends IRepository<SubcategoryID, Subcategory, SubcategoryPrimitives> {
	findAllByCategory(categoryID: CategoryID): Promise<Subcategory[]>;
	findByName(name: SubcategoryName): Promise<Subcategory | null>;
}
