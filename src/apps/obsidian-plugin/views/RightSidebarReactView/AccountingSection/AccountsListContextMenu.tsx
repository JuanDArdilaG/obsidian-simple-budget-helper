import { useContext, useEffect, useState } from "react";
import { ContextMenu, Input } from "apps/obsidian-plugin/components";
import { CheckCircle, CircleX, EqualNot } from "lucide-react";
import { Account, AccountBalance } from "contexts/Accounts";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { TransactionsContext } from "../Contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";

export const AccountsListContextMenu = ({
	account,
	onAdjust,
}: {
	account: Account;
	onAdjust: () => Promise<void>;
}) => {
	const logger = useLogger("AccountsListContextMenu");
	const {
		useCases: { adjustAccount },
	} = useContext(TransactionsContext);

	const [newBalance, setNewBalance] = useState(account.balance);
	const [askForNewAmount, setAskForNewAmount] = useState(false);

	const handleAdjust = async () => {
		await adjustAccount.execute({
			accountID: account.id,
			newBalance,
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
					logger.debug(
						"invalidClickChecker",
						{
							innerText: (e.target as HTMLElement)?.innerText,
						},
						{ on: false }
					);
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
							<Input<PriceValueObject>
								id="newAmount"
								value={newBalance}
								label="New balance"
								onChange={(e) =>
									setNewBalance(
										new AccountBalance(e.valueOf())
									)
								}
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
