import { CategoryID } from "contexts/Categories/domain";
import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import {
	SubCategory,
	SubCategoryID,
	SubCategoryName,
	SubcategoryPrimitives,
} from "contexts/Subcategories/domain";

export interface ISubCategoriesRepository
	extends IRepository<SubCategoryID, SubCategory, SubcategoryPrimitives> {
	findAllByCategory(categoryID: CategoryID): Promise<SubCategory[]>;
	findByName(name: SubCategoryName): Promise<SubCategory | null>;
}
