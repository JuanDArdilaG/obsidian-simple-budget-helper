import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { Category, CategoryName, CategoryPrimitives } from "../domain";

export interface ICategoriesRepository extends IRepository<
	string,
	Category,
	CategoryPrimitives
> {
	findByName(name: CategoryName): Promise<Category | null>;
}
