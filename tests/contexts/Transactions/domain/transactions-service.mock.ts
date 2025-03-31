import { CategoryID } from "contexts/Categories/domain";
import { AccountID, AccountBalance } from "contexts/Accounts/domain";
import {
	ITransactionsService,
	TransactionID,
	Transaction,
} from "contexts/Transactions/domain";

export class TransactionsServiceMock implements ITransactionsService {
	constructor(public transactions: Transaction[]) {}

	async getByID(id: TransactionID): Promise<Transaction> {
		throw new Error("not implemented");
	}

	async delete(id: TransactionID): Promise<void> {
		throw new Error("not implemented");
	}

	async record(transaction: Transaction): Promise<void> {
		this.transactions.push(transaction);
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
