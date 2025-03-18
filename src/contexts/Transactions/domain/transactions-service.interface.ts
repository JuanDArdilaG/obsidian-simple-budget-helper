import { Item } from "contexts/Items/domain/item.entity";
import { TransactionID } from "./transaction-id.valueobject";
import { Transaction } from "./transaction.entity";
import { Criteria } from "../../Shared/domain/criteria";

export interface ITransactionsService {
	recordItem(item: Item): Promise<Transaction>;
	update(transaction: Transaction): Promise<void>;
	delete(id: TransactionID): Promise<void>;
	getAll(): Promise<Transaction[]>;
	getByCriteria(criteria: Criteria<Transaction>): Promise<Transaction[]>;
}
