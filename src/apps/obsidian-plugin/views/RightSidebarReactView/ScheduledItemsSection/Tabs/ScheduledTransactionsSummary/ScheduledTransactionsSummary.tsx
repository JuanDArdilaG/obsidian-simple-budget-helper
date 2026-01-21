import { PriceValueObject } from "@juandardilag/value-objects";
import { useContext, useEffect, useMemo, useState } from "react";
import { AccountsContext, ScheduledTransactionsContext } from "../../..";
import { ScheduledMonthlyReport } from "../../../../../../../contexts/Reports/domain";
import { ItemRecurrenceInfo } from "../../../../../../../contexts/ScheduledTransactions/domain";
import { useLogger } from "../../../../../hooks";
import { MonthlyProjectedChart } from "./MonthlyProjectedChart";
import { ScheduledTransactionsSummarySection } from "./ScheduledTransactionsSummarySection";

export const ScheduledTransactionsSummary = () => {
	const { logger } = useLogger("ScheduledTransactionsSummary");
	const {
		scheduledItems,
		useCases: { nextMonthExpensesUseCase },
	} = useContext(ScheduledTransactionsContext);
	const { accounts } = useContext(AccountsContext);

	const [nextMonthExpenses, setNextMonthExpenses] = useState<
		{ info: ItemRecurrenceInfo; monthAmount: PriceValueObject }[]
	>([]);

	useEffect(() => {
		nextMonthExpensesUseCase.execute().then((recurrences) => {
			logger.debug("Next month expenses fetched", { recurrences });
			setNextMonthExpenses(recurrences);
		});
	}, [scheduledItems]);

	const displayedItemsReport = useMemo(() => {
		logger.debug("Generating displayed items report", {
			scheduledItems,
			accounts,
		});
		const report = new ScheduledMonthlyReport(scheduledItems, accounts);
		logger.debug("Displayed items report generated", { report });
		return report;
	}, [scheduledItems, accounts]);

	return (
		<div
			style={{
				marginTop: "20px",
				borderTop: "1px solid var(--background-modifier-border)",
				paddingTop: "15px",
				paddingBottom: "15px",
			}}
		>
			<h4
				style={{
					margin: "0 0 15px 0",
					color: "var(--text-normal)",
				}}
			>
				Monthly Financial Summary
			</h4>

			<MonthlyProjectedChart />

			<ScheduledTransactionsSummarySection
				title="Savings for Next Month's Expenses"
				color="blue"
				items={nextMonthExpenses.map((transaction) => ({
					id: transaction.info.scheduledTransactionId.value,
					name: transaction.info.name.value,
					amount: transaction.monthAmount.abs(),
				}))}
			/>

			<ScheduledTransactionsSummarySection
				title="Total Incomes Per Month"
				color="green"
				items={displayedItemsReport
					.onlyIncomes()
					.scheduledTransactionsWithAccounts.map(
						({ scheduledTransaction, account, toAccount }) => ({
							id: scheduledTransaction.id.value,
							name: scheduledTransaction.name.value,
							amount: scheduledTransaction.getPricePerMonthWithAccountTypes(
								account.type,
								toAccount?.type,
							),
						}),
					)}
			/>

			<ScheduledTransactionsSummarySection
				title="Total Expenses Per Month"
				color="red"
				items={displayedItemsReport
					.onlyExpenses()
					.scheduledTransactionsWithAccounts.map(
						({ scheduledTransaction, account, toAccount }) => ({
							id: scheduledTransaction.id.value,
							name: scheduledTransaction.name.value,
							amount: scheduledTransaction.getPricePerMonthWithAccountTypes(
								account.type,
								toAccount?.type,
							),
						}),
					)}
			/>

			<ScheduledTransactionsSummarySection
				title="Long-term Expenses Per Month"
				color="red"
				items={displayedItemsReport
					.onlyInfiniteRecurrent()
					.onlyExpenses()
					.scheduledTransactionsWithAccounts.map(
						({ scheduledTransaction, account, toAccount }) => ({
							id: scheduledTransaction.id.value,
							name: scheduledTransaction.name.value,
							amount: scheduledTransaction.getPricePerMonthWithAccountTypes(
								account.type,
								toAccount?.type,
							),
						}),
					)}
			/>

			<ScheduledTransactionsSummarySection
				title="Short-term Expenses Per Month"
				color="red"
				items={displayedItemsReport
					.onlyFiniteRecurrent()
					.onlyExpenses()
					.scheduledTransactionsWithAccounts.map(
						({ scheduledTransaction, account, toAccount }) => ({
							id: scheduledTransaction.id.value,
							name: scheduledTransaction.name.value,
							amount: scheduledTransaction.getPricePerMonthWithAccountTypes(
								account.type,
								toAccount?.type,
							),
						}),
					)}
			/>

			<ScheduledTransactionsSummarySection
				title="Total Per Month"
				color="blue"
				items={displayedItemsReport.scheduledTransactionsWithAccounts.map(
					({ scheduledTransaction, account, toAccount }) => ({
						id: scheduledTransaction.id.value,
						name: scheduledTransaction.name.value,
						amount: scheduledTransaction.getPricePerMonthWithAccountTypes(
							account.type,
							toAccount?.type,
						),
					}),
				)}
			/>
		</div>
	);
};
