import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { Transaction } from "./transaction.entity";
import { TransactionID } from "./transaction-id.valueobject";

export interface ITransactionsRepository
	extends IRepository<Transaction, TransactionID> {}
