import { ResponsiveScheduledItem } from "apps/obsidian-plugin/components/ResponsiveScheduledItem";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { AccountName } from "contexts/Accounts/domain";
import React, { useContext, useEffect, useState } from "react";
import {
	ItemRecurrenceInfo,
	ScheduledTransaction,
} from "../../../../../../contexts/ScheduledTransactions/domain";
import { ConfirmationModal } from "../../../../components/ConfirmationModal";
import { EditScheduleTransactionPanel } from "../../../../panels/CreateBudgetItemPanel/EditScheduleTransactionPanel";
import {
	AccountsContext,
	AppContext,
	ScheduledTransactionsContext,
} from "../../Contexts";

export const AllScheduledTransactionsList = ({
	selectedItem,
	setSelectedItem,
	action,
	setAction,
}: {
	selectedItem?: ScheduledTransaction;
	setSelectedItem: React.Dispatch<
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

	const { getAccountByID } = useContext(AccountsContext);
	const {
		scheduledItems,
		updateScheduledTransactions,
		useCases: { nextPendingOccurrenceUseCase },
	} = useContext(ScheduledTransactionsContext);

	useEffect(() => {
		updateScheduledTransactions();
	}, []);

	const [showPanel, setShowPanel] = useState<{
		item: ScheduledTransaction;
		action?: "record";
	}>();

	useEffect(() => {
		logger.debug("item selected for action", {
			selectedItem,
			action,
		});
		if (selectedItem) {
			setShowPanel({ item: selectedItem, action });
		} else {
			// Clear the panel when selectedItem is undefined
			setShowPanel(undefined);
		}
	}, [action, selectedItem]);

	useEffect(() => {
		if (!showPanel) {
			if (action) setAction(undefined);
		}
	}, [setAction, showPanel]);

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
									scheduledTransaction.id
								);
							logger.debug("Fetched next occurrence", {
								scheduledTransactionId: scheduledTransaction.id,
								recurrence,
							});
							return { scheduledTransaction, recurrence };
						} catch (error) {
							logger.error(
								"Error fetching next occurrence",
								error
							);
							return {
								scheduledTransaction,
								recurrence: undefined,
							};
						}
					})
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
							const account = getAccountByID(
								scheduledTransaction.originAccounts[0]
									?.accountId
							);
							const toAccount = scheduledTransaction
								.destinationAccounts[0]?.accountId
								? getAccountByID(
										scheduledTransaction
											.destinationAccounts[0]?.accountId
								  )
								: undefined;
							const accountName =
								account?.name ??
								new AccountName("Unknown Account");
							const toAccountName = toAccount?.name;
							const fullAccountName = toAccountName
								? new AccountName(
										`${accountName.toString()} -> ${toAccountName.toString()}`
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
										setSelectedItem={setSelectedItem}
										context="all-items"
										currentAction={showPanel?.action}
										handleEdit={async () => {
											logger.debug(
												"Editing scheduled transaction",
												{
													scheduledTransactionId:
														scheduledTransaction.id,
												}
											);
											setTransactionToEdit(
												scheduledTransaction
											);
										}}
										handleDelete={async (
											_: React.MouseEvent
										) => {
											logger.debug(
												"Deleting scheduled transaction",
												{
													scheduledTransactionId:
														scheduledTransaction.id,
												}
											);
											new ConfirmationModal(
												plugin.app,
												async (confirm) => {
													if (confirm) {
														await deleteScheduledTransaction.execute(
															{
																id: scheduledTransaction.id,
															}
														);
														updateScheduledTransactions();
													}
													setSelectedItem(undefined);
												}
											).open();
										}}
									/>
									{transactionToEdit?.id.equalTo(
										scheduledTransaction.id
									) && (
										<EditScheduleTransactionPanel
											scheduledTransaction={
												transactionToEdit
											}
											onClose={() =>
												setTransactionToEdit(null)
											}
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
