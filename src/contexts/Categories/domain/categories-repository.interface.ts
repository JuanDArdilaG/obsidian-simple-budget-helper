import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { Category } from "./category.entity";
import { CategoryID } from "./category-id.valueobject";
import { CategoryName } from "./category-name.valueobject";

export interface ICategoriesRepository
	extends IRepository<Category, CategoryID> {
	findAllNames(): Promise<CategoryName[]>;
}
