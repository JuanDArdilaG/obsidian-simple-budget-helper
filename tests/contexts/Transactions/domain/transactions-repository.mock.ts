import {
	TransactionID,
	Transaction,
	TransactionPrimitives,
	ITransactionsRepository,
} from "contexts/Transactions/domain";
import { RepositoryMock } from "../../../../tests/contexts/Shared/domain/repository.mock";

export class TransactionsRepositoryMock
	extends RepositoryMock<TransactionID, Transaction, TransactionPrimitives>
	implements ITransactionsRepository {}
