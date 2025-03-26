import { CommandUseCase } from "contexts/Shared";
import {
	ISubCategoriesService,
	SubCategory,
} from "contexts/Subcategories/domain";

export type CreateSubCategoryUseCaseInput = SubCategory;

export class CreateSubCategoryUseCase
	implements CommandUseCase<CreateSubCategoryUseCaseInput>
{
	constructor(private _subCategoriesService: ISubCategoriesService) {}

	async execute(subCategory: SubCategory): Promise<void> {
		await this._subCategoriesService.create(subCategory);
	}
}
