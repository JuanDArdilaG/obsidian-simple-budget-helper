import { Criteria, Nanoid } from "contexts/Shared/domain";
import {
	ISubCategoriesService,
	Subcategory,
	SubcategoryName,
	SubcategoryPrimitives,
} from "contexts/Subcategories/domain";

export class SubcategoriesServiceMock implements ISubCategoriesService {
	constructor(public subcategories: Subcategory[]) {}
	create(subCategory: Subcategory): Promise<void> {
		throw new Error("Method not implemented.");
	}
	getByNameWithCreation(
		categoryID: Nanoid,
		name: SubcategoryName,
	): Promise<Subcategory> {
		throw new Error("Method not implemented.");
	}
	exists(id: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	getByID(id: string): Promise<Subcategory> {
		const subCategory = this.subcategories.find(
			(subCategory) => subCategory.id === id,
		);
		if (!subCategory) throw new Error("subCategory not found on get");
		return Promise.resolve(subCategory);
	}
	getByCriteria(
		criteria: Criteria<SubcategoryPrimitives>,
	): Promise<Subcategory[]> {
		throw new Error("Method not implemented.");
	}
	getAll(): Promise<Subcategory[]> {
		throw new Error("Method not implemented.");
	}
	update(item: Subcategory): Promise<void> {
		throw new Error("Method not implemented.");
	}
	delete(id: string): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
