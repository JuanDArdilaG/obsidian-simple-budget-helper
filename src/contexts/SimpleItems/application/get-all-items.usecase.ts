import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Item } from "contexts/SimpleItems/domain";
import { SimpleItemsService } from "contexts/SimpleItems/application/simple-items.service";

export type GetAllItemsUseCaseOutput = Item[];

export class GetAllItemsUseCase
	implements QueryUseCase<void, GetAllItemsUseCaseOutput>
{
	constructor(private _itemsService: SimpleItemsService) {}

	async execute(): Promise<GetAllItemsUseCaseOutput> {
		return await this._itemsService.getAll();
	}
}
