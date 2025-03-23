import { Criteria } from "contexts/Shared";
import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import {
	TransactionID,
	Transaction,
	TransactionPrimitives,
	ITransactionsRepository,
} from "contexts/Transactions/domain";

export class TransactionsRepositoryMock implements ITransactionsRepository {
	constructor(private _transactions: Transaction[]) {}

	findById(id: TransactionID): Promise<Transaction | null> {
		throw new Error("Method not implemented.");
	}
	findAll(): Promise<Transaction[]> {
		throw new Error("Method not implemented.");
	}
	async findByCriteria(
		criteria: Criteria<TransactionPrimitives>
	): Promise<Transaction[]> {
		return this._transactions;
	}
	persist(entity: Transaction): Promise<void> {
		throw new Error("Method not implemented.");
	}
	deleteById(id: TransactionID): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	exists(id: TransactionID): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
}
