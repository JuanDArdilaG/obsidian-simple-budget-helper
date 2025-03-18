import { Item } from "contexts/Items/domain/item.entity";
import { TransactionID } from "./transaction-id.valueobject";
import { Transaction } from "./transaction.entity";
import { Criteria } from "../../Shared/domain/criteria";
import { ITransactionsService } from "./transactions-service.interface";

export class TransactionsServiceMock implements ITransactionsService {
	constructor(private _transactions: Transaction[]) {}

	async recordItem(item: Item): Promise<Transaction> {
		throw new Error("not implemented");
	}

	async update(transaction: Transaction): Promise<void> {
		throw new Error("not implemented");
	}

	async delete(id: TransactionID): Promise<void> {
		throw new Error("not implemented");
	}

	async getAll(): Promise<Transaction[]> {
		throw new Error("not implemented");
	}

	async getByCriteria(
		criteria: Criteria<Transaction>
	): Promise<Transaction[]> {
		return this._transactions;
	}
}
