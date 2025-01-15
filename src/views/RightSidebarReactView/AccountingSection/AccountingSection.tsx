import { AccountingList } from "./AccountingList";
import { Budget } from "budget/Budget/Budget";

export const AccountingSection = ({
	budget,
	refresh,
}: {
	budget: Budget;
	refresh: () => void;
}) => {
	return (
		<>
			<h1>Accounting</h1>
			<AccountingList refresh={refresh} budget={budget} />
		</>
	);
};
