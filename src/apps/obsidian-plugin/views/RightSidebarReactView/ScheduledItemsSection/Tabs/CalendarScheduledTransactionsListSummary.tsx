import { AccountsReport } from "contexts/Reports/domain";
import { useContext, useMemo } from "react";
import { AccountAssetSubtype } from "../../../../../../contexts/Accounts/domain";
import { ScheduledTransactionsReport } from "../../../../../../contexts/Reports/domain/scheduled-transactions-report.entity";
import { ItemRecurrenceInfo } from "../../../../../../contexts/ScheduledTransactions/domain";
import { TransactionAmount } from "../../../../../../contexts/Transactions/domain";
import { AccountsContext } from "../../Contexts";

export const CalendarScheduledTransactionsListSummary = ({
	date,
	recurrences,
}: {
	date: Date;
	recurrences: ItemRecurrenceInfo[];
}) => {
	const scheduledTransactionsReport = useMemo(
		() => new ScheduledTransactionsReport(recurrences),
		[recurrences],
	);

	const { accounts } = useContext(AccountsContext);
	const accountsReport = useMemo(
		() =>
			new AccountsReport(
				accounts.filter(
					(account) =>
						account.subtype === AccountAssetSubtype.CASH ||
						account.subtype === AccountAssetSubtype.CHECKING,
				),
			),
		[accounts],
	);
	const totalSpendableAssets = useMemo(
		() => accountsReport.getTotalForAssets().value,
		[accountsReport],
	);

	const total = useMemo(
		() => scheduledTransactionsReport.totalAmount,
		[scheduledTransactionsReport],
	);

	return (
		<div>
			<div
				style={{
					textAlign: "right",
					marginTop: 10,
					marginBottom: 10,
					fontSize: "1.3em",
					padding: "12px",
					backgroundColor: "var(--background-secondary)",
					borderRadius: "6px",
					border: "1px solid var(--background-modifier-border)",
				}}
			>
				{/* Scheduled Items Summary */}
				<div
					style={{
						marginBottom: "12px",
						paddingBottom: "8px",
						borderBottom:
							"1px solid var(--background-modifier-border)",
					}}
				>
					<div
						style={{
							fontSize: "0.9em",
							color: "var(--text-muted)",
							marginBottom: "4px",
						}}
					>
						Scheduled Transactions Summary
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "4px",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Incomes until {date.toLocaleDateString()}:
						</span>
						<span
							style={{
								color: "var(--color-green)",
								fontWeight: "500",
							}}
						>
							{new TransactionAmount(
								scheduledTransactionsReport.onlyIncomes()
									.totalAmount,
							).toString()}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "4px",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Expenses until {date.toLocaleDateString()}:
						</span>
						<span
							style={{
								color: "var(--color-red)",
								fontWeight: "500",
							}}
						>
							{new TransactionAmount(
								scheduledTransactionsReport.onlyExpenses()
									.totalAmount,
							).toString()}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							{total < 0 ? "Deficit" : "Surplus"}:
						</span>
						<span
							style={{
								fontWeight: "600",
								color:
									total < 0
										? "var(--color-red)"
										: "var(--color-green)",
							}}
						>
							{new TransactionAmount(total).toString()}
						</span>
					</div>
				</div>

				{/* Current Financial Position */}
				<div>
					<div
						style={{
							fontSize: "0.9em",
							color: "var(--text-muted)",
							marginBottom: "4px",
						}}
					>
						Current Financial Position
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "4px",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Current Cash & Checking:
						</span>
						<span style={{ fontWeight: "500" }}>
							{new TransactionAmount(
								totalSpendableAssets,
							).toString()}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Projected Balance by {date.toLocaleDateString()}:
						</span>
						<span
							style={{
								fontWeight: "600",
								color:
									totalSpendableAssets + total < 0
										? "var(--color-red)"
										: "var(--color-green)",
							}}
						>
							{new TransactionAmount(
								totalSpendableAssets + total,
							).toString()}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
