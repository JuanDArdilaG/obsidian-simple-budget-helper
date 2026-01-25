import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import {
	Subcategory,
	SubcategoryName,
	SubcategoryPrimitives,
} from "contexts/Subcategories/domain";
import { Nanoid } from "../../Shared/domain";

export interface ISubcategoriesRepository extends IRepository<
	string,
	Subcategory,
	SubcategoryPrimitives
> {
	findAllByCategory(categoryID: Nanoid): Promise<Subcategory[]>;
	findByName(name: SubcategoryName): Promise<Subcategory | null>;
}
