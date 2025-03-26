import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryName } from "./subcategory-name.valueobject";
import { SubCategory } from "./subcategory.entity";

export interface ISubCategoriesService {
	create(subCategory: SubCategory): Promise<void>;
	getByNameWithCreation(
		categoryID: CategoryID,
		name: SubCategoryName
	): Promise<SubCategory>;
}
