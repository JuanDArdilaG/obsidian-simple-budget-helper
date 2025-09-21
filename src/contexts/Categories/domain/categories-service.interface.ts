import { IService } from "contexts/Shared/domain";
import { CategoryName } from "./category-name.valueobject";
import { Category, CategoryPrimitives } from "./category.entity";
import { CategoryID } from "./category-id.valueobject";

export interface ICategoriesService
	extends IService<CategoryID, Category, CategoryPrimitives> {
	create(category: Category): Promise<void>;
	getByNameWithCreation(name: CategoryName): Promise<Category>;
}
