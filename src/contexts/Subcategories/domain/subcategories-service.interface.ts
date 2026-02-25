import { IService } from "contexts/Shared/domain";
import { Nanoid } from "../../Shared/domain/value-objects/id/nanoid.valueobject";
import { SubcategoryName } from "./subcategory-name.valueobject";
import { Subcategory, SubcategoryPrimitives } from "./subcategory.entity";

export interface ISubCategoriesService extends IService<
	string,
	Subcategory,
	SubcategoryPrimitives
> {
	create(subCategory: Subcategory): Promise<void>;
	getByNameWithCreation(
		categoryID: Nanoid,
		name: SubcategoryName,
	): Promise<Subcategory>;
}
