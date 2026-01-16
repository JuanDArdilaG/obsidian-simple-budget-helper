import {
	AccountsContext,
	ScheduledTransactionsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import {
	TransactionAmount,
	TransactionDate,
} from "contexts/Transactions/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { X } from "lucide-react";
import { useContext, useState } from "react";
import { ItemRecurrenceInfo } from "../../../contexts/ScheduledTransactions/domain";
import { DateInput } from "../components/Input/DateInput";
import { PriceInput } from "../components/Input/PriceInput";
import { Select } from "../components/Select/Select";
import { useLogger } from "../hooks";

export const RecordItemPanel = ({
	recurrence,
	onClose,
	updateItems,
}: {
	recurrence: ItemRecurrenceInfo;
	onClose: () => void;
	updateItems?: () => void;
}) => {
	const { logger, debug } = useLogger("RecordItemPanel");
	debug("recurrence", { recurrence });
	const {
		useCases: { recordItemRecurrence },
	} = useContext(ScheduledTransactionsContext);
	const { updateAccounts } = useContext(AccountsContext);
	const { updateTransactions } = useContext(TransactionsContext);
	const { accounts, getAccountByID } = useContext(AccountsContext);
	const [fromSplits, setFromSplits] = useState(
		recurrence.originAccounts.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		}))
	);
	const [toSplits, setToSplits] = useState(
		recurrence.destinationAccounts.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		}))
	);
	const [date, setDate] = useState<Date>(recurrence.date.value);
	const [isRecording, setIsRecording] = useState(false);

	const handleRecord = async () => {
		setIsRecording(true);
		try {
			// Convert the split arrays to PaymentSplit objects
			const paymentFromSplits = fromSplits.map(
				(split) =>
					new PaymentSplit(
						new AccountID(split.accountId),
						split.amount
					)
			);
			const paymentToSplits = toSplits.map(
				(split) =>
					new PaymentSplit(
						new AccountID(split.accountId),
						split.amount
					)
			);

			await recordItemRecurrence.execute({
				scheduledTransactionID: recurrence.scheduledTransactionId,
				occurrenceIndex: recurrence.occurrenceIndex,
				fromSplits: paymentFromSplits,
				toSplits: paymentToSplits,
				date: new TransactionDate(date),
			});

			updateAccounts();
			updateTransactions();

			// Call updateItems immediately to refresh the UI
			logger.debug("Calling updateItems to refresh the list");
			updateItems?.();

			onClose();
		} catch {
			logger.debug("Failed to record item");
		} finally {
			setIsRecording(false);
		}
	};

	return (
		<div
			className="record-budget-item-modal"
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				backgroundColor: "var(--background-primary)",
				border: "1px solid var(--background-modifier-border)",
				borderRadius: "8px",
				padding: "20px",
				maxWidth: "500px",
				width: "90%",
				maxHeight: "80vh",
				overflow: "auto",
				zIndex: 1000,
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "20px",
				}}
			>
				<h3 style={{ margin: 0, color: "var(--text-normal)" }}>
					Record: {recurrence.name.toString()}
				</h3>
				<button
					onClick={onClose}
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						color: "var(--text-muted)",
						padding: "4px",
					}}
				>
					<X size={20} />
				</button>
			</div>

			<div style={{ marginBottom: "20px" }}>
				<h4
					style={{
						margin: "0 0 10px 0",
						color: "var(--text-normal)",
					}}
				>
					From Splits
				</h4>
				{fromSplits.map((split, idx) => (
					<div
						key={split.accountId}
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
							marginBottom: "8px",
							padding: "8px",
							backgroundColor: "var(--background-secondary)",
							borderRadius: "4px",
							flexWrap: "wrap",
							flexDirection:
								window.innerWidth < 600 ? "column" : "row",
						}}
					>
						<div style={{ flex: 1, minWidth: 0, width: "100%" }}>
							<Select
								id={`from-account-${idx}`}
								label="Account"
								value={split.accountId}
								values={accounts}
								onChange={(val) => {
									const newSplits = [...fromSplits];
									newSplits[idx].accountId = val;
									setFromSplits(newSplits);
								}}
								getOptionLabel={(account) =>
									account.name.toString()
								}
								getOptionValue={(account) => account.id.value}
							/>
						</div>
						<div style={{ flex: 2, minWidth: 0, width: "100%" }}>
							<PriceInput
								id={`from-amount-${idx}`}
								value={split.amount}
								onChange={(priceVO) => {
									const newSplits = [...fromSplits];
									newSplits[idx].amount =
										new TransactionAmount(
											priceVO.toNumber()
										);
									setFromSplits(newSplits);
								}}
								prefix={
									getAccountByID(
										new AccountID(split.accountId)
									)?.currency.symbol ?? "$"
								}
							/>
						</div>
						<button
							onClick={() =>
								setFromSplits(
									fromSplits.filter((_, i) => i !== idx)
								)
							}
							style={{
								backgroundColor: "var(--color-red)",
								color: "white",
								border: "none",
								borderRadius: "4px",
								padding: "4px 8px",
								cursor: "pointer",
								fontSize: "0.8em",
								marginTop: window.innerWidth < 600 ? 8 : 0,
								width:
									window.innerWidth < 600
										? "100%"
										: undefined,
							}}
						>
							Remove
						</button>
					</div>
				))}
				<button
					onClick={() =>
						setFromSplits([
							...fromSplits,
							{
								accountId: accounts[0]?.id.value || "",
								amount: new TransactionAmount(0),
							},
						])
					}
					style={{
						backgroundColor: "var(--color-green)",
						color: "white",
						border: "none",
						borderRadius: "4px",
						padding: "6px 12px",
						cursor: "pointer",
						fontSize: "0.9em",
					}}
				>
					Add Split
				</button>
			</div>

			<div style={{ marginBottom: "20px" }}>
				<h4
					style={{
						margin: "0 0 10px 0",
						color: "var(--text-normal)",
					}}
				>
					To Splits
				</h4>
				{toSplits.map((split, idx) => (
					<div
						key={split.accountId}
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
							marginBottom: "8px",
							padding: "8px",
							backgroundColor: "var(--background-secondary)",
							borderRadius: "4px",
							flexWrap: "wrap",
							flexDirection:
								window.innerWidth < 600 ? "column" : "row",
						}}
					>
						<div style={{ flex: 1, minWidth: 0, width: "100%" }}>
							<Select
								id={`to-account-${idx}`}
								label="Account"
								value={split.accountId}
								values={accounts}
								onChange={(val) => {
									const newSplits = [...toSplits];
									newSplits[idx].accountId = val;
									setToSplits(newSplits);
								}}
								getOptionLabel={(account) =>
									account.name.toString()
								}
								getOptionValue={(account) => account.id.value}
							/>
						</div>
						<div style={{ flex: 2, minWidth: 0, width: "100%" }}>
							<PriceInput
								id={`to-amount-${idx}`}
								value={split.amount}
								onChange={(priceVO) => {
									const newSplits = [...toSplits];
									newSplits[idx].amount =
										new TransactionAmount(
											priceVO.toNumber()
										);
									setToSplits(newSplits);
								}}
								prefix={
									getAccountByID(
										new AccountID(split.accountId)
									)?.currency.symbol ?? "$"
								}
							/>
						</div>
						<button
							onClick={() =>
								setToSplits(
									toSplits.filter((_, i) => i !== idx)
								)
							}
							style={{
								backgroundColor: "var(--color-red)",
								color: "white",
								border: "none",
								borderRadius: "4px",
								padding: "4px 8px",
								cursor: "pointer",
								fontSize: "0.8em",
								marginTop: window.innerWidth < 600 ? 8 : 0,
								width:
									window.innerWidth < 600
										? "100%"
										: undefined,
							}}
						>
							Remove
						</button>
					</div>
				))}
				<button
					onClick={() =>
						setToSplits([
							...toSplits,
							{
								accountId: accounts[0]?.id.value || "",
								amount: new TransactionAmount(0),
							},
						])
					}
					style={{
						backgroundColor: "var(--color-green)",
						color: "white",
						border: "none",
						borderRadius: "4px",
						padding: "6px 12px",
						cursor: "pointer",
						fontSize: "0.9em",
					}}
				>
					Add Split
				</button>
			</div>

			<div style={{ marginBottom: "20px" }}>
				<DateInput label="Date" value={date} onChange={setDate} />
			</div>

			<div
				style={{
					display: "flex",
					gap: "10px",
					justifyContent: "flex-end",
				}}
			>
				<button
					onClick={onClose}
					style={{
						backgroundColor: "var(--background-modifier-border)",
						color: "var(--text-normal)",
						border: "none",
						borderRadius: "4px",
						padding: "8px 16px",
						cursor: "pointer",
					}}
				>
					Cancel
				</button>
				<button
					onClick={handleRecord}
					disabled={isRecording}
					style={{
						backgroundColor: isRecording
							? "var(--text-muted)"
							: "var(--color-blue)",
						color: "white",
						border: "none",
						borderRadius: "4px",
						padding: "8px 16px",
						cursor: isRecording ? "not-allowed" : "pointer",
						opacity: isRecording ? 0.6 : 1,
					}}
				>
					{isRecording ? "Recording..." : "Record"}
				</button>
			</div>
		</div>
	);
};
