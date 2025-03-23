import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import {
	TransactionID,
	Transaction,
	TransactionPrimitives,
} from "contexts/Transactions/domain";

export interface ITransactionsRepository
	extends IRepository<TransactionID, Transaction, TransactionPrimitives> {}
