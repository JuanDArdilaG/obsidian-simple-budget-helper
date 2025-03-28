import { Criteria } from "contexts/Shared";
import {
	TransactionID,
	Transaction,
	TransactionPrimitives,
	ITransactionsRepository,
} from "contexts/Transactions/domain";

export class TransactionsRepositoryMock implements ITransactionsRepository {
	constructor(private _transactions: Transaction[]) {}

	async findById(id: TransactionID): Promise<Transaction | null> {
		return this._transactions.find((t) => t.id.equalTo(id)) ?? null;
	}

	async findAll(): Promise<Transaction[]> {
		return this._transactions;
	}

	async findByCriteria(
		criteria: Criteria<TransactionPrimitives>
	): Promise<Transaction[]> {
		return this._transactions;
	}

	async persist(entity: Transaction): Promise<void> {
		const i = this._transactions.findIndex((t) => t.id.equalTo(entity.id));
		if (i === -1) {
			this._transactions.push(entity);
		} else {
			this._transactions[i] = entity;
		}
	}

	async deleteById(id: TransactionID): Promise<boolean> {
		throw new Error("Method not implemented.");
	}

	async exists(id: TransactionID): Promise<boolean> {
		return this._transactions.some((t) => t.id.equalTo(id));
	}
}
