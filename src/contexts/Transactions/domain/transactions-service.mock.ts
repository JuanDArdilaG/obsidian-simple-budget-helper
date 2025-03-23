import { CategoryID, Category } from "contexts/Categories";
import { TransactionID } from "./transaction-id.valueobject";
import { Transaction } from "./transaction.entity";
import { ITransactionsService } from "./transactions-service.interface";
import { AccountID, AccountBalance } from "contexts/Accounts";

export class TransactionsServiceMock implements ITransactionsService {
	constructor(private _transactions: Transaction[]) {}

	async getByID(id: TransactionID): Promise<Transaction> {
		throw new Error("not implemented");
	}

	async delete(id: TransactionID): Promise<void> {
		throw new Error("not implemented");
	}

	async record(transaction: Transaction): Promise<void> {
		throw new Error("not implemented");
	}

	async accountAdjustment(
		accountID: AccountID,
		newBalance: AccountBalance
	): Promise<void> {
		throw new Error("not implemented");
	}

	async getByCategory(category: CategoryID): Promise<Transaction[]> {
		throw new Error("not implemented");
	}

	async getAll(): Promise<Transaction[]> {
		throw new Error("not implemented");
	}
}
