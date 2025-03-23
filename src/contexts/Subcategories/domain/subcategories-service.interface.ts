import { CategoryID } from "contexts/Categories/domain";
import { SubcategoryName } from "./subcategory-name.valueobject";
import { Subcategory } from "./subcategory.entity";

export interface ISubCategoriesService {
	create(subCategory: Subcategory): Promise<void>;
	getByNameWithCreation(
		categoryID: CategoryID,
		name: SubcategoryName
	): Promise<Subcategory>;
}
