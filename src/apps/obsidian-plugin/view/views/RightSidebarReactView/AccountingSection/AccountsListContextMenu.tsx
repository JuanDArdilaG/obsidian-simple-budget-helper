import { useEffect, useState } from "react";
import { ContextMenu } from "./ContextMenu";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { CheckCircle, CircleX, EqualNot } from "lucide-react";
import { Logger } from "../../../../../../contexts/Shared/infrastructure/logger";
import { Account, AccountID } from "contexts";
import { Input } from "apps/obsidian-plugin/view/components";

export const AccountsListContextMenu = ({
	account,
	onAdjust,
}: {
	account: Account;
	onAdjust: (account: AccountID, newAmount: number) => Promise<void>;
}) => {
	const [newAmount, setNewAmount] = useState(account.balance);
	const [askForNewAmount, setAskForNewAmount] = useState(false);

	useEffect(() => {
		const newAmountInput = document.getElementById("newAmount");
		const listener = async (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				await onAdjust(
					account.id,
					newAmount.valueOf() - account.balance.valueOf()
				);
			}
		};
		if (newAmountInput) {
			newAmountInput.addEventListener("keydown", listener);
		}

		return () => {
			if (newAmountInput) {
				newAmountInput.removeEventListener("keydown", listener);
			}
		};
	}, [newAmount, account.balance, account, onAdjust]);

	return (
		<ContextMenu
			hookProps={{
				lock: askForNewAmount,
				invalidClickChecker: (e) => {
					Logger.debug(
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
								value={newAmount}
								label="New balance"
								onChange={(e) => setNewAmount(e)}
							/>

							<CheckCircle
								onClick={async () => {
									await onAdjust(
										account.id,
										newAmount.valueOf() -
											account.balance.valueOf()
									);
								}}
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
