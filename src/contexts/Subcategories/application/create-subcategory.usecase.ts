import { CommandUseCase } from "contexts/Shared";
import {
	ISubCategoriesService,
	Subcategory,
} from "contexts/Subcategories/domain";

export type CreateSubCategoryUseCaseInput = Subcategory;

export class CreateSubCategoryUseCase
	implements CommandUseCase<CreateSubCategoryUseCaseInput>
{
	constructor(private _subCategoriesService: ISubCategoriesService) {}

	async execute(subCategory: Subcategory): Promise<void> {
		await this._subCategoriesService.create(subCategory);
	}
}
