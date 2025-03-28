import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { RecurrentItem } from "contexts/Items/domain";
import { ItemsService } from "contexts/Items/application";

export type GetAllRecurrentItemsUseCaseOutput = RecurrentItem[];

export class GetAllRecurrentItemsUseCase
	implements QueryUseCase<void, GetAllRecurrentItemsUseCaseOutput>
{
	constructor(private _itemsService: ItemsService) {}

	async execute(): Promise<GetAllRecurrentItemsUseCaseOutput> {
		return await this._itemsService.getAllRecurrent();
	}
}
