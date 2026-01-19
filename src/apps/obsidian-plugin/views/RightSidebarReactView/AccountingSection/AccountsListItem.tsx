import {
	PriceValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	IconButton,
	Typography,
} from "@mui/material";
import { Button } from "apps/obsidian-plugin/components/Button";
import { ConfirmationDialog } from "apps/obsidian-plugin/components/ConfirmationDialog";
import {
	Account,
	AccountAssetSubtype,
	AccountBalance,
	AccountLiabilitySubtype,
	AccountSubtype,
} from "contexts/Accounts/domain";
import {
	CheckCircle,
	CircleX,
	EqualNot,
	Pencil,
	SettingsIcon,
	Trash2,
} from "lucide-react";
import { useContext, useState } from "react";
import { Input } from "../../../components/Input/Input";
import { PriceInput } from "../../../components/Input/PriceInput";
import { Select } from "../../../components/Select";
import { AccountsContext, AppContext, TransactionsContext } from "../Contexts";

export const AccountsListItem = ({ account }: { account: Account }) => {
	const { plugin } = useContext(AppContext);
	const {
		updateAccounts,
		useCases: { deleteAccount, changeAccountName, changeAccountSubtype },
	} = useContext(AccountsContext);
	const { updateTransactions } = useContext(TransactionsContext);
	const {
		useCases: { adjustAccount },
	} = useContext(TransactionsContext);

	const [adjustingBalance, setAdjustingBalance] = useState(false);
	const [newBalance, setNewBalance] = useState(
		new PriceValueObject(account.balance.value.value, {
			decimals: 2,
			withSign: true,
			withZeros: true,
		}),
	);

	const [editing, setEditing] = useState(false);
	const [newName, setNewName] = useState(account.name.toString());
	const [newSubtype, setNewSubtype] = useState(account.subtype);

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleEdit = async () => {
		try {
			if (newName !== account.name.toString())
				await changeAccountName.execute({
					id: account.id,
					name: new StringValueObject(newName),
				});
			if (newSubtype !== account.subtype)
				await changeAccountSubtype.execute({
					id: account.id,
					subtype: newSubtype,
				});
			updateTransactions();
			updateAccounts();
		} catch (error) {
			console.error("Error changing account name:", error);
			// Show error message to user
			if (error instanceof Error) {
				alert(`Failed to change account name: ${error.message}`);
			} else {
				alert("Failed to change account name. Please try again.");
			}
		} finally {
			setEditing(false);
		}
	};

	const handleDelete = async () => {
		try {
			await deleteAccount.execute(account.id);
			updateAccounts();
			updateTransactions();
		} catch (error) {
			console.error("Error deleting account:", error);
			// Show error message to user
			if (error instanceof Error) {
				alert(`Failed to delete account: ${error.message}`);
			} else {
				alert("Failed to delete account. Please try again.");
			}
		}
	};

	return (
		<>
			<Accordion style={{ width: "100%" }}>
				<AccordionSummary
					expandIcon={
						<SettingsIcon
							style={{
								color: "var(--text-normal)",
								marginLeft: "10px",
							}}
						/>
					}
					aria-controls={`account-${account.id}-content`}
					id={`account-${account.id}-header`}
				>
					<Typography
						variant="body1"
						style={{
							display: "flex",
							gap: "10px",
							alignItems: "center",
						}}
					>
						<span>{account.name.toString()}</span>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							{account.subtype.toString()[0].toUpperCase() +
								account.subtype.toString().slice(1)}
						</span>
					</Typography>
					<Typography
						variant="body2"
						style={{
							marginLeft: "auto",
							marginRight: "10px",
							fontWeight: "bold",
						}}
					>
						{account.balance.value.toString()}{" "}
						{account.currency.value ===
						plugin.settings.defaultCurrency
							? ""
							: account.currency.value}{" "}
						{account.defaultCurrencyBalance
							? `(≈ ${account.defaultCurrencyBalance.value.toString()} ${
									plugin.settings.defaultCurrency
								})`
							: ""}
					</Typography>
				</AccordionSummary>
				<AccordionDetails
					style={{
						backgroundColor: "var(--background-secondary)",
					}}
				>
					<div
						style={{
							display: "flex",
							gap: "8px",
							alignItems: "center",
							marginBottom: "8px",
						}}
					>
						<Button
							label="Adjust"
							icon={<EqualNot />}
							onClick={async () => {
								setAdjustingBalance(!adjustingBalance);
								setEditing(false);
							}}
						/>
						<IconButton
							onClick={() => {
								setEditing(!editing);
								setAdjustingBalance(false);
							}}
							color="error"
							size="small"
							title="Change account name"
						>
							<Pencil size={16} />
						</IconButton>
						<IconButton
							onClick={() => setShowDeleteDialog(true)}
							color="error"
							size="small"
							title="Delete account"
						>
							<Trash2 size={16} />
						</IconButton>
					</div>
					<div
						style={{
							display: "flex",
							width: "100%",
						}}
					>
						{adjustingBalance && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
								}}
							>
								<PriceInput
									id="newAmount"
									placeholder="New balance"
									value={newBalance}
									onChange={setNewBalance}
									prefix={account.currency.symbol}
								/>

								<CheckCircle
									style={{
										color: "var(--text-normal)",
									}}
									onClick={async () => {
										await adjustAccount.execute({
											accountID: account.id,
											newBalance: new AccountBalance(
												newBalance,
											),
										});

										updateAccounts();
										updateTransactions();
										setAdjustingBalance(false);
									}}
								/>
								<CircleX
									style={{
										color: "var(--text-normal)",
									}}
									onClick={() => setAdjustingBalance(false)}
								/>
							</div>
						)}
						{editing && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
								}}
							>
								<Input<string>
									id="newName"
									label="Name"
									value={newName}
									onChange={setNewName}
								/>
								<Select<AccountSubtype>
									id="newSubtype"
									label="Subtype"
									value={newSubtype}
									values={
										account.type.isAsset()
											? Object.values(AccountAssetSubtype)
											: Object.values(
													AccountLiabilitySubtype,
												)
									}
									onChange={(value) =>
										setNewSubtype(value as AccountSubtype)
									}
								/>

								<CheckCircle
									style={{
										color: "var(--text-normal)",
									}}
									onClick={handleEdit}
								/>
								<CircleX
									style={{
										color: "var(--text-normal)",
									}}
									onClick={() => setEditing(false)}
								/>
							</div>
						)}
					</div>
				</AccordionDetails>
			</Accordion>

			<ConfirmationDialog
				open={showDeleteDialog}
				onClose={() => setShowDeleteDialog(false)}
				onConfirm={handleDelete}
				title="Delete Account"
				message={`Are you sure you want to delete the account "${account.name.toString()}"? This action cannot be undone and will remove all associated transaction history.`}
				confirmText="Delete Account"
				cancelText="Cancel"
				severity="error"
			/>
		</>
	);
};
