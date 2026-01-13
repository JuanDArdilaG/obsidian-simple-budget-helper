import { AccountID, IntegrityCheckReport } from "contexts/Accounts/domain";
import React, { useContext, useState } from "react";
import { TransactionAmount } from "../../../contexts/Transactions/domain";
import { AccountsContext } from "../views";
import { Button } from "./Button";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { PriceLabel } from "./PriceLabel";

interface IntegrityCheckModalProps {
	isOpen: boolean;
	onClose: () => void;
	onRunIntegrityCheck: () => Promise<IntegrityCheckReport>;
	onResolveDiscrepancy: (accountId: string) => Promise<void>;
}

export const IntegrityCheckModal: React.FC<IntegrityCheckModalProps> = ({
	isOpen,
	onClose,
	onRunIntegrityCheck,
	onResolveDiscrepancy,
}) => {
	const [isRunning, setIsRunning] = useState(false);
	const [report, setReport] = useState<IntegrityCheckReport | null>(null);
	const [selectedAccountForResolution, setSelectedAccountForResolution] =
		useState<string | null>(null);
	const [isResolving, setIsResolving] = useState(false);

	const handleRunCheck = async () => {
		setIsRunning(true);
		try {
			const checkReport = await onRunIntegrityCheck();
			setReport(checkReport);
		} catch (error) {
			console.error("Failed to run integrity check:", error);
		} finally {
			setIsRunning(false);
		}
	};

	const handleResolveDiscrepancy = async (accountId: string) => {
		setIsResolving(true);
		try {
			await onResolveDiscrepancy(accountId);
			// Re-run the integrity check to update the report
			await handleRunCheck();
			setSelectedAccountForResolution(null);
		} catch (error) {
			console.error("Failed to resolve discrepancy:", error);
		} finally {
			setIsResolving(false);
		}
	};

	const confirmResolveDiscrepancy = (accountId: string) => {
		setSelectedAccountForResolution(accountId);
	};

	if (!isOpen) return null;

	const reportPrimitives = report?.toPrimitives();

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				backgroundColor: "rgba(0, 0, 0, 0.5)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
			}}
		>
			<div
				style={{
					backgroundColor: "var(--background-primary)",
					border: "1px solid var(--background-modifier-border)",
					borderRadius: "8px",
					padding: "24px",
					maxWidth: "80vw",
					maxHeight: "80vh",
					overflow: "auto",
					minWidth: "600px",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "16px",
					}}
				>
					<h2 style={{ margin: 0, color: "var(--text-normal)" }}>
						Account Integrity Check
					</h2>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							fontSize: "18px",
							color: "var(--text-muted)",
							cursor: "pointer",
						}}
					>
						×
					</button>
				</div>

				<div style={{ marginBottom: "16px" }}>
					<Button
						label={
							isRunning
								? "Running Check..."
								: "Run Integrity Check"
						}
						onClick={handleRunCheck}
						disabled={isRunning}
					/>
				</div>

				{reportPrimitives && (
					<div>
						<div
							style={{
								marginBottom: "16px",
								padding: "12px",
								backgroundColor: "var(--background-secondary)",
								borderRadius: "4px",
							}}
						>
							<h3
								style={{
									margin: "0 0 8px 0",
									color: "var(--text-normal)",
								}}
							>
								Summary
							</h3>
							<p
								style={{
									margin: "4px 0",
									color: "var(--text-normal)",
								}}
							>
								Total accounts checked:{" "}
								{reportPrimitives.totalAccountsChecked}
							</p>
							<p
								style={{
									margin: "4px 0",
									color: "var(--text-normal)",
								}}
							>
								Accounts with discrepancies:{" "}
								{reportPrimitives.totalDiscrepancies}
							</p>
							<p
								style={{
									margin: "4px 0",
									color: "var(--text-normal)",
								}}
							>
								Execution date:{" "}
								{new Date(
									reportPrimitives.executionDate
								).toLocaleString()}
							</p>
						</div>

						{reportPrimitives.hasDiscrepancies ? (
							<div>
								<h3 style={{ color: "var(--text-error)" }}>
									Accounts with Discrepancies
								</h3>
								{reportPrimitives.results
									.filter((result) => !result.hasIntegrity)
									.map((result) => (
										<AccountIntegrityItem
											key={result.accountId}
											result={result}
											onResolve={() =>
												confirmResolveDiscrepancy(
													result.accountId
												)
											}
											isResolving={isResolving}
										/>
									))}
							</div>
						) : (
							<div
								style={{
									padding: "16px",
									textAlign: "center",
									color: "var(--text-success)",
								}}
							>
								✅ All accounts have integrity! No discrepancies
								found.
							</div>
						)}

						{reportPrimitives.results.some(
							(result) => result.hasIntegrity
						) && (
							<div style={{ marginTop: "24px" }}>
								<h3 style={{ color: "var(--text-success)" }}>
									Accounts with Integrity
								</h3>
								{reportPrimitives.results
									.filter((result) => result.hasIntegrity)
									.map((result) => (
										<AccountIntegrityItem
											key={result.accountId}
											result={result}
											onResolve={() => {}}
											isResolving={false}
											showResolveButton={false}
										/>
									))}
							</div>
						)}
					</div>
				)}

				<ConfirmationDialog
					open={!!selectedAccountForResolution}
					onClose={() => setSelectedAccountForResolution(null)}
					onConfirm={() =>
						selectedAccountForResolution &&
						handleResolveDiscrepancy(selectedAccountForResolution)
					}
					title="Resolve Account Discrepancy"
					message="This will adjust the account balance to match the expected balance calculated from transaction history. This action cannot be undone. Do you want to continue?"
					confirmText="Resolve Discrepancy"
					cancelText="Cancel"
					severity="warning"
				/>
			</div>
		</div>
	);
};

interface AccountIntegrityItemProps {
	result: {
		accountId: string;
		expectedBalance: number;
		actualBalance: number;
		hasIntegrity: boolean;
		discrepancy: number;
	};
	onResolve: () => void;
	isResolving: boolean;
	showResolveButton?: boolean;
}

const AccountIntegrityItem: React.FC<AccountIntegrityItemProps> = ({
	result,
	onResolve,
	isResolving,
	showResolveButton = true,
}) => {
	const { getAccountByID } = useContext(AccountsContext);
	return (
		<div
			style={{
				padding: "12px",
				margin: "8px 0",
				border: `1px solid ${
					result.hasIntegrity
						? "var(--text-success)"
						: "var(--text-error)"
				}`,
				borderRadius: "4px",
				backgroundColor: "var(--background-secondary)",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div>
					<p
						style={{
							margin: "0 0 4px 0",
							fontWeight: "bold",
							color: "var(--text-normal)",
						}}
					>
						Account:{" "}
						{getAccountByID(new AccountID(result.accountId))
							?.name ?? result.accountId}
					</p>
					<p style={{ margin: "2px 0", color: "var(--text-normal)" }}>
						Expected Balance:{" "}
						<PriceLabel
							price={
								new TransactionAmount(result.expectedBalance)
							}
						/>
					</p>
					<p style={{ margin: "2px 0", color: "var(--text-normal)" }}>
						Actual Balance:{" "}
						<PriceLabel
							price={new TransactionAmount(result.actualBalance)}
						/>
					</p>
					{!result.hasIntegrity && (
						<p
							style={{
								margin: "2px 0",
								color: "var(--text-error)",
							}}
						>
							Discrepancy:{" "}
							<PriceLabel
								price={
									new TransactionAmount(result.discrepancy)
								}
							/>
						</p>
					)}
				</div>
				{!result.hasIntegrity && showResolveButton && (
					<Button
						label={isResolving ? "Resolving..." : "Resolve"}
						onClick={onResolve}
						disabled={isResolving}
						style={{
							backgroundColor: "var(--text-error)",
							color: "white",
						}}
					/>
				)}
			</div>
		</div>
	);
};
