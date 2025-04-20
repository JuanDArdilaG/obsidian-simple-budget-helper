import { useContext, useEffect, useState } from "react";
import { ContextMenu } from "apps/obsidian-plugin/components/ContextMenu";
import { CheckCircle, CircleX, EqualNot } from "lucide-react";
import { Account, AccountBalance } from "contexts/Accounts/domain";
import { TransactionsContext } from "../Contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";

export const AccountsListContextMenu = ({
	account,
	onAdjust,
}: {
	account: Account;
	onAdjust: () => Promise<void>;
}) => {
	const { logger } = useLogger("AccountsListContextMenu");
	const {
		useCases: { adjustAccount },
	} = useContext(TransactionsContext);

	const [newBalance, setNewBalance] = useState(account.balance.value);
	const [askForNewAmount, setAskForNewAmount] = useState(false);

	const handleAdjust = async () => {
		await adjustAccount.execute({
			accountID: account.id,
			newBalance: new AccountBalance(newBalance),
		});
		await onAdjust();
	};

	useEffect(() => {
		const newAmountInput = document.getElementById("newAmount");
		const listener = async (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				handleAdjust();
			}
		};

		if (newAmountInput)
			newAmountInput.addEventListener("keydown", listener);

		return () => {
			if (newAmountInput)
				newAmountInput.removeEventListener("keydown", listener);
		};
	}, [newBalance, account.balance, account, onAdjust]);

	return (
		<ContextMenu
			hookProps={{
				lock: askForNewAmount,
				invalidClickChecker: (e: any) => {
					logger.debug("invalidClickChecker", {
						innerText: (e.target as HTMLElement)?.innerText,
					});
					return (
						(e.target as HTMLElement)?.innerText?.trim() ===
						"Adjust"
					);
				},
			}}
			menu={
				<ul
					style={{
						listStyle: "none",
						backgroundColor: "white",
						color: "black",
						padding: "15px",
					}}
				>
					<li style={{ marginBottom: "10px" }}>
						{account.name.toString()}
					</li>
					<li
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
						}}
						onClick={async () => {
							setAskForNewAmount(!askForNewAmount);
						}}
					>
						<EqualNot size={16} /> Adjust
					</li>
					{askForNewAmount && (
						<div style={{ display: "flex", width: "100%" }}>
							<PriceInput
								id="newAmount"
								label="New balance"
								value={newBalance}
								onChange={setNewBalance}
							/>

							<CheckCircle
								onClick={async () => await handleAdjust()}
							/>
							<CircleX
								onClick={() => setAskForNewAmount(false)}
							/>
						</div>
					)}
				</ul>
			}
		/>
	);
};
