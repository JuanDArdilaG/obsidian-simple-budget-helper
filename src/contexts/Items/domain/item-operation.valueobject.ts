import { Operation } from "contexts/Shared/domain";

export class ItemOperation extends Operation {
	static expense(): ItemOperation {
		return new ItemOperation("expense");
	}

	static income(): ItemOperation {
		return new ItemOperation("income");
	}

	static transfer(): ItemOperation {
		return new ItemOperation("transfer");
	}
}
