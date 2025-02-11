import { MouseEvent, useEffect, useState } from "react";
import { ContextMenu } from "./ContextMenu";
import { Input } from "view/components/Input";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { CheckCircle, CircleX } from "lucide-react";
import { Logger } from "utils/logger";

export const AccountsListContextMenu = ({
	account,
	actualAmount,
	onAdjust,
}: {
	account: string;
	actualAmount: number;
	onAdjust: (account: string, newAmount: number) => Promise<void>;
}) => {
	const [newAmount, setNewAmount] = useState(actualAmount);
	const [askForNewAmount, setAskForNewAmount] = useState(false);

	useEffect(() => {
		const newAmountInput = document.getElementById("newAmount");
		const listener = async (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				await onAdjust(account, newAmount - actualAmount);
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
	}, [newAmount, actualAmount, account, onAdjust]);

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
					return (e.target as HTMLElement)?.innerText === "Adjust";
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
					<li style={{ marginBottom: "10px" }}>{account}</li>
					<li
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
						}}
						onClick={async () => {
							setAskForNewAmount(!askForNewAmount);
						}}
					>
						Adjust
					</li>
					{askForNewAmount && (
						<div style={{ display: "flex", width: "100%" }}>
							<Input<PriceValueObject>
								id="newAmount"
								value={new PriceValueObject(newAmount)}
								label="New balance"
								onChange={(e) => setNewAmount(e.toNumber())}
							/>

							<CheckCircle
								onClick={async () => {
									await onAdjust(
										account,
										newAmount - actualAmount
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
