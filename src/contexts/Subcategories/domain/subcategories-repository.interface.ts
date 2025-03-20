import { CategoryID } from "contexts/Categories";
import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { Subcategory, SubcategoryID } from "contexts/Subcategories/domain";

export interface ISubcategoriesRepository
	extends IRepository<SubcategoryID, Subcategory> {
	findAllByCategory(categoryID: CategoryID): Promise<Subcategory[]>;
}
