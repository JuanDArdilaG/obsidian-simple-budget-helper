import { CategoryName } from "./category-name.valueobject";
import { Category } from "./category.entity";

export interface ICategoriesService {
	create(category: Category): Promise<void>;
	getByNameWithCreation(name: CategoryName): Promise<Category>;
}
