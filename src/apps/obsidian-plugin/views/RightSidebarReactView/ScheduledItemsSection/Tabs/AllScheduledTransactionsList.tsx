import { ResponsiveScheduledItem } from "apps/obsidian-plugin/components/ResponsiveScheduledItem";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { AccountName } from "contexts/Accounts/domain";
import React, { useContext, useEffect, useState } from "react";
import {
	ItemRecurrenceInfo,
	ScheduledTransaction,
} from "../../../../../../contexts/ScheduledTransactions/domain";
import { ConfirmationModal } from "../../../../components/ConfirmationModal";
import { EditScheduledTransactionPanel } from "../../../../panels/CreateBudgetItemPanel/EditScheduledTransactionPanel";
import { RecordItemPanel } from "../../../../panels/RecordItemPanel";
import { AppContext, ScheduledTransactionsContext } from "../../Contexts";

export const AllScheduledTransactionsList = ({
	selectedTransaction,
	setSelectedTransaction,
	action,
	setAction,
}: {
	selectedTransaction?: ScheduledTransaction;
	setSelectedTransaction: React.Dispatch<
		React.SetStateAction<ScheduledTransaction | undefined>
	>;
	action?: "record";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
}) => {
	const { logger } = useLogger("AllScheduledTransactionsList");

	const { plugin } = useContext(AppContext);
	const {
		useCases: { deleteScheduledTransaction },
	} = useContext(ScheduledTransactionsContext);

	const {
		scheduledItems,
		updateScheduledTransactions,
		useCases: { nextPendingOccurrenceUseCase },
	} = useContext(ScheduledTransactionsContext);

	useEffect(() => {
		updateScheduledTransactions();
	}, []);

	const [
		scheduledTransactionsWithNextOccurrence,
		setScheduledTransactionsWithNextOccurrence,
	] = useState<
		Array<{
			scheduledTransaction: ScheduledTransaction;
			recurrence: ItemRecurrenceInfo;
		}>
	>([]);

	useEffect(() => {
		const fetchNextOccurrences = async () => {
			logger.debug("Fetching next occurrences for scheduled items", {
				scheduledItems,
			});
			const results = (
				await Promise.all(
					scheduledItems.map(async (scheduledTransaction) => {
						try {
							const recurrence =
								await nextPendingOccurrenceUseCase.execute(
									scheduledTransaction.id,
								);
							logger.debug("Fetched next occurrence", {
								scheduledTransactionId: scheduledTransaction.id,
								recurrence,
							});
							return { scheduledTransaction, recurrence };
						} catch (error) {
							logger.error(
								"Error fetching next occurrence",
								error,
							);
							return {
								scheduledTransaction,
								recurrence: undefined,
							};
						}
					}),
				)
			).filter((result) => !!result.recurrence) as Array<{
				scheduledTransaction: ScheduledTransaction;
				recurrence: ItemRecurrenceInfo;
			}>;
			setScheduledTransactionsWithNextOccurrence(results);
		};
		fetchNextOccurrences();
	}, [scheduledItems, nextPendingOccurrenceUseCase]);

	const [transactionToEdit, setTransactionToEdit] =
		useState<ScheduledTransaction | null>(null);

	return (
		<div>
			<ul
				style={{
					listStyle: "none",
				}}
			>
				{(() => {
					return scheduledTransactionsWithNextOccurrence
						.toSorted((a, b) => {
							const dateA = a.recurrence.date;
							const dateB = b.recurrence.date;
							return dateA.isGreaterOrEqualThan(dateB) ? 1 : -1;
						})
						.map(({ scheduledTransaction, recurrence }) => {
							const account =
								scheduledTransaction.originAccounts[0]?.account;
							const toAccount =
								scheduledTransaction.destinationAccounts[0]
									?.account;
							const accountName =
								account?.name ??
								new AccountName("Unknown Account");
							const toAccountName = toAccount?.name;
							const fullAccountName = toAccountName
								? new AccountName(
										`${accountName.toString()} -> ${toAccountName.toString()}`,
									)
								: accountName;

							return (
								<div key={scheduledTransaction.id.value}>
									<ResponsiveScheduledItem
										scheduleTransaction={
											scheduledTransaction
										}
										recurrence={recurrence}
										accountName={fullAccountName}
										price={
											scheduledTransaction.originAmount
										}
										isSelected={false}
										showBalanceInfo={false}
										setAction={setAction}
										setSelectedItem={setSelectedTransaction}
										context="all-items"
										currentAction={action}
										handleEdit={async () => {
											logger.debug(
												"Editing scheduled transaction",
												{
													scheduledTransactionId:
														scheduledTransaction.id,
												},
											);
											if (
												transactionToEdit &&
												scheduledTransaction.id.equalTo(
													transactionToEdit?.id,
												)
											) {
												setTransactionToEdit(null);
												setAction(undefined);
												return;
											}
											setTransactionToEdit(
												scheduledTransaction,
											);
										}}
										handleDelete={async (
											_: React.MouseEvent,
										) => {
											logger.debug(
												"Deleting scheduled transaction",
												{
													scheduledTransactionId:
														scheduledTransaction.id,
												},
											);
											new ConfirmationModal(
												plugin.app,
												async (confirm) => {
													if (confirm) {
														await deleteScheduledTransaction.execute(
															{
																id: scheduledTransaction.id,
															},
														);
														updateScheduledTransactions();
													}
													setSelectedTransaction(
														undefined,
													);
												},
											).open();
										}}
									/>
									{transactionToEdit?.id.equalTo(
										scheduledTransaction.id,
									) && (
										<EditScheduledTransactionPanel
											scheduledTransaction={
												transactionToEdit
											}
											recurrence={recurrence}
											onClose={() =>
												setTransactionToEdit(null)
											}
											updateItems={
												updateScheduledTransactions
											}
											initialScope="all"
										/>
									)}
									{action === "record" &&
										selectedTransaction?.id.value ===
											scheduledTransaction.id.value && (
											<RecordItemPanel
												recurrence={recurrence}
												onClose={() => {
													setSelectedTransaction(
														undefined,
													);
													setAction(undefined);
												}}
												updateItems={
													updateScheduledTransactions
												}
											/>
										)}
								</div>
							);
						});
				})()}
			</ul>
		</div>
	);
};
