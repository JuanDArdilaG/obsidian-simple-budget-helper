import { StringValueObject } from "@juandardilag/value-objects";
import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { ITransactionsRepository } from "../domain";

export class GetAllUniqueItemStoresUseCase
	implements QueryUseCase<void, StringValueObject[]>
{
	constructor(
		private readonly _transactionsRepository: ITransactionsRepository
	) {}

	async execute(): Promise<StringValueObject[]> {
		return await this._transactionsRepository.findAllUniqueItemStores();
	}
}
