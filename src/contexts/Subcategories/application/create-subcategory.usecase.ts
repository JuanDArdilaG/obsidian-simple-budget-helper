import { CommandUseCase } from "contexts/Shared/domain";
import {
	ISubCategoriesService,
	Subcategory,
} from "contexts/Subcategories/domain";

export type CreateSubCategoryUseCaseInput = Subcategory;

export class CreateSubCategoryUseCase implements CommandUseCase<CreateSubCategoryUseCaseInput> {
	constructor(private readonly subCategoriesService: ISubCategoriesService) {}

	async execute(subCategory: Subcategory): Promise<void> {
		await this.subCategoriesService.create(subCategory);
	}
}
