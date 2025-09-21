import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryName } from "./subcategory-name.valueobject";
import { SubCategory, SubcategoryPrimitives } from "./subcategory.entity";
import { IService } from "contexts/Shared/domain";
import { SubCategoryID } from "./subcategory-id.valueobject";

export interface ISubCategoriesService
	extends IService<SubCategoryID, SubCategory, SubcategoryPrimitives> {
	create(subCategory: SubCategory): Promise<void>;
	getByNameWithCreation(
		categoryID: CategoryID,
		name: SubCategoryName
	): Promise<SubCategory>;
}
