import { Operation, OperationType } from "contexts/Shared/domain";

export class TransactionOperation extends Operation {
	constructor(value: OperationType) {
		super(value);
	}

	static expense(): TransactionOperation {
		return new TransactionOperation("expense");
	}

	static income(): TransactionOperation {
		return new TransactionOperation("income");
	}

	static transfer(): TransactionOperation {
		return new TransactionOperation("transfer");
	}
}
