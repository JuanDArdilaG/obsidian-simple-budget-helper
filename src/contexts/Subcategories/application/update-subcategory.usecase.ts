import { CommandUseCase } from "contexts/Shared/domain";
import {
	ISubCategoriesService,
	Subcategory,
} from "contexts/Subcategories/domain";

export class UpdateSubCategoryUseCase implements CommandUseCase<Subcategory> {
	constructor(private readonly subCategoriesService: ISubCategoriesService) {}

	async execute(subCategory: Subcategory): Promise<void> {
		await this.subCategoriesService.update(subCategory);
	}
}
