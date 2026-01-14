import {
	DateValueObject,
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
import { Account, AccountBalance } from "contexts/Accounts/domain";
import {
	CheckCircle,
	CircleX,
	EqualNot,
	Pencil,
	SettingsIcon,
	Trash2,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Currency } from "../../../../../contexts/Currencies/domain/currency.vo";
import { Input } from "../../../components/Input/Input";
import { PriceInput } from "../../../components/Input/PriceInput";
import { AccountsContext, AppContext, TransactionsContext } from "../Contexts";
import { ExchangeRatesContext } from "../Contexts/ExchangeRatesContext";

export const AccountsListItem = ({ account }: { account: Account }) => {
	const { plugin } = useContext(AppContext);
	const {
		updateAccounts,
		useCases: { deleteAccount, changeAccountName },
	} = useContext(AccountsContext);
	const { updateTransactions } = useContext(TransactionsContext);
	const {
		useCases: { adjustAccount },
	} = useContext(TransactionsContext);
	const {
		useCases: { getExchangeRate },
	} = useContext(ExchangeRatesContext);

	const [adjustingBalance, setAdjustingBalance] = useState(false);
	const [newBalance, setNewBalance] = useState(
		new PriceValueObject(account.balance.value.value, {
			decimals: 2,
			withSign: true,
			withZeros: true,
		})
	);

	const [changingName, setChangingName] = useState(false);
	const [newName, setNewName] = useState(account.name.toString());

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleChangeName = async () => {
		try {
			await changeAccountName.execute({
				id: account.id,
				name: new StringValueObject(newName),
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
			setChangingName(false);
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

	const [convertedBalance, setConvertedBalance] =
		useState<PriceValueObject | null>(null);

	useEffect(() => {
		const fetchConvertedBalance = async () => {
			console.log("Fetching converted balance for account", {
				accountId: account.id,
				accountCurrency: account.currency.toString(),
				defaultCurrency: plugin.settings.defaultCurrency,
			});
			if (account.currency.value === plugin.settings.defaultCurrency) {
				return null;
			}

			const exchangeRate = await getExchangeRate.execute({
				fromCurrency: account.currency,
				toCurrency: new Currency(plugin.settings.defaultCurrency),
				date: DateValueObject.createNowDate(),
			});

			if (!exchangeRate) {
				return null;
			}

			const convertedValue =
				exchangeRate.rate.value * account.balance.value.value;

			setConvertedBalance(
				new PriceValueObject(convertedValue, {
					decimals: 2,
					withSign: true,
					withZeros: true,
				})
			);
		};

		fetchConvertedBalance();
	}, [account, getExchangeRate, plugin.settings.defaultCurrency]);

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
					<Typography variant="body1">
						{account.name.toString()}:{" "}
						{account.balance.value.toString()}{" "}
						{account.currency.value ===
						plugin.settings.defaultCurrency
							? ""
							: account.currency.value}{" "}
						{convertedBalance
							? `(≈ ${convertedBalance.toString()} ${
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
								setChangingName(false);
							}}
						/>
						<IconButton
							onClick={() => {
								setChangingName(!changingName);
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
												newBalance
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
						{changingName && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
								}}
							>
								<Input<string>
									id="newName"
									label="New name"
									value={newName}
									onChange={setNewName}
								/>

								<CheckCircle
									style={{
										color: "var(--text-normal)",
									}}
									onClick={handleChangeName}
								/>
								<CircleX
									style={{
										color: "var(--text-normal)",
									}}
									onClick={() => setChangingName(false)}
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
