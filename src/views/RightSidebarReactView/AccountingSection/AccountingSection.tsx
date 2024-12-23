import { AccountingList } from "./AccountingList";
import { Budget } from "budget/Budget";

export const AccountingSection = ({ budget }: { budget: Budget }) => {
	return (
		<>
			<h1>Accounting</h1>
			<AccountingList budget={budget} />
		</>
	);
};
