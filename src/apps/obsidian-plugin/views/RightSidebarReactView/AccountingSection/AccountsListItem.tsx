import {
	Accordion,
	AccordionSummary,
	Typography,
	AccordionDetails,
} from "@mui/material";
import { Button } from "apps/obsidian-plugin/components/Button";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { Account, AccountBalance } from "contexts/Accounts/domain";
import { SettingsIcon, EqualNot, CheckCircle, CircleX } from "lucide-react";
import { useContext, useState } from "react";
import { AccountsContext, TransactionsContext } from "../Contexts";

export const AccountsListItem = ({ account }: { account: Account }) => {
	const { updateAccounts } = useContext(AccountsContext);
	const { updateTransactions } = useContext(TransactionsContext);
	const {
		useCases: { adjustAccount },
	} = useContext(TransactionsContext);

	const [adjustingBalance, setAdjustingBalance] = useState(false);
	const [newBalance, setNewBalance] = useState(account.balance.value);

	return (
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
					{account.balance.value.toString()}
				</Typography>
			</AccordionSummary>
			<AccordionDetails
				style={{
					backgroundColor: "var(--background-secondary)",
				}}
			>
				<Button
					label="Adjust"
					icon={<EqualNot />}
					onClick={async () => setAdjustingBalance(!adjustingBalance)}
				/>
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
								label="New balance"
								value={newBalance}
								onChange={setNewBalance}
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
				</div>
			</AccordionDetails>
		</Accordion>
	);
};
