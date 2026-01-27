import { IService } from "contexts/Shared/domain";
import { CategoryName } from "./category-name.valueobject";
import { Category, CategoryPrimitives } from "./category.entity";

export interface ICategoriesService extends IService<
	string,
	Category,
	CategoryPrimitives
> {
	create(category: Category): Promise<void>;
	getByNameWithCreation(name: CategoryName): Promise<Category>;
}
