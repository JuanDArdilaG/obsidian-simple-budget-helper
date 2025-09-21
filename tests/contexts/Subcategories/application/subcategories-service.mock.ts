import { CategoryID } from "contexts/Categories/domain";
import { Criteria } from "contexts/Shared/domain";
import {
	ISubCategoriesService,
	SubCategory,
	SubCategoryID,
	SubCategoryName,
	SubcategoryPrimitives,
} from "contexts/Subcategories/domain";

export class SubcategoriesServiceMock implements ISubCategoriesService {
	constructor(public subcategories: SubCategory[]) {}
	create(subCategory: SubCategory): Promise<void> {
		throw new Error("Method not implemented.");
	}
	getByNameWithCreation(
		categoryID: CategoryID,
		name: SubCategoryName
	): Promise<SubCategory> {
		throw new Error("Method not implemented.");
	}
	exists(id: SubCategoryID): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	getByID(id: SubCategoryID): Promise<SubCategory> {
		const subCategory = this.subcategories.find(
			(subCategory) => subCategory.id.value === id.value
		);
		if (!subCategory) throw new Error("subCategory not found on get");
		return Promise.resolve(subCategory);
	}
	getByCriteria(
		criteria: Criteria<SubcategoryPrimitives>
	): Promise<SubCategory[]> {
		throw new Error("Method not implemented.");
	}
	getAll(): Promise<SubCategory[]> {
		throw new Error("Method not implemented.");
	}
	update(item: SubCategory): Promise<void> {
		throw new Error("Method not implemented.");
	}
	delete(id: SubCategoryID): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
