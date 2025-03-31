import { AccountID, AccountBalance } from "contexts/Accounts/domain";
import { TransactionID } from "./transaction-id.valueobject";
import { Transaction } from "./transaction.entity";
import { CategoryID } from "contexts/Categories/domain";

export interface ITransactionsService {
	record(transaction: Transaction): Promise<void>;
	accountAdjustment(
		accountID: AccountID,
		newBalance: AccountBalance
	): Promise<void>;

	getAll(): Promise<Transaction[]>;
	getByID(id: TransactionID): Promise<Transaction>;
	getByCategory(category: CategoryID): Promise<Transaction[]>;
	delete(id: TransactionID): Promise<void>;
}
