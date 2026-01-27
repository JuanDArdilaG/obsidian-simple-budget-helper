import { Plus, Trash2, Wallet } from "lucide-react";
import { useContext, useEffect, useMemo } from "react";
import { Nanoid } from "../../../contexts/Shared/domain";
import {
	AccountSplit,
	TransactionAmount,
} from "../../../contexts/Transactions/domain";
import { AccountsContext } from "../views";

export function AccountSplitter({
	label,
	splits,
	onChange,
	totalAmount,
}: Readonly<{
	label: string;
	splits: AccountSplit[];
	onChange: (splits: AccountSplit[]) => void;
	totalAmount: number;
}>) {
	const { accountsMap } = useContext(AccountsContext);
	const currentTotal = useMemo(
		() => splits.reduce((sum, s) => sum + s.amount.value, 0),
		[splits],
	);
	const remaining = useMemo(
		() => totalAmount - currentTotal,
		[totalAmount, currentTotal],
	);
	const isBalanced = useMemo(() => Math.abs(remaining) < 0.01, [remaining]);

	const addSplit = () => {
		const usedIds = new Set(splits.map((s) => s.accountId.value));
		const nextAccount = Array.from(accountsMap.values()).find(
			(acc) => !usedIds.has(acc.id),
		);
		if (!nextAccount) return; // No more accounts to add
		onChange([
			...splits,
			new AccountSplit(
				nextAccount.nanoid,
				new TransactionAmount(Math.max(remaining, 0)),
			),
		]);
	};

	const updateSplit = (
		index: number,
		field: keyof AccountSplit,
		value: string | number,
	) => {
		const newSplits = [...splits];
		newSplits[index] = new AccountSplit(
			field === "accountId"
				? new Nanoid(value as string)
				: newSplits[index].accountId,
			field === "amount"
				? new TransactionAmount(value as number)
				: newSplits[index].amount,
		);
		onChange(newSplits);
	};

	const removeSplit = (index: number) => {
		onChange(splits.filter((_, i) => i !== index));
	};

	useEffect(() => {
		if (isBalanced) return;
		if (splits.length === 1) {
			// Auto-adjust the single split to match the total amount
			updateSplit(0, "amount", totalAmount);
		}
	}, [totalAmount]);

	return (
		<div className="bg-gray-50! rounded-lg! p-4! border! border-gray-200!">
			<div className="flex! justify-between! items-center! mb-3!">
				<div className="flex! items-center! gap-2!">
					<Wallet size={16} className="text-gray-500!" />
					<span className="font-medium! text-gray-700!">{label}</span>
				</div>
				<div
					className={`text-sm! font-medium! ${isBalanced ? "text-green-600!" : "text-amber-600!"}`}
				>
					{isBalanced ? (
						<span className="flex! items-center! gap-1!">
							Match{" "}
							<div className="w-2! h-2! rounded-full bg-green-500!" />
						</span>
					) : (
						<span>
							{remaining > 0 ? "Remaining: " : "Over: "}
							{new TransactionAmount(
								Math.abs(remaining),
							).toString()}
						</span>
					)}
				</div>
			</div>

			<div className="space-y-2!">
				{splits.map((split, index) => (
					<div
						key={split.accountId.value}
						className="flex! gap-2! items-center!"
					>
						<select
							value={split.accountId.value}
							onChange={(e) =>
								updateSplit(index, "accountId", e.target.value)
							}
							className="flex-1! px-3! py-2! text-sm! border! border-gray-300! rounded-lg! focus:ring-1! focus:ring-indigo-500! bg-white!"
						>
							{Array.from(accountsMap).map(([id, acc]) => (
								<option key={id} value={id}>
									{acc.name.value} ({acc.currency.value})
								</option>
							))}
						</select>
						<div className="relative! w-32!">
							<span className="absolute! left-3! top-1/2! -translate-y-1/2! text-gray-500! text-sm!">
								$
							</span>
							<input
								type="string"
								value={split.amount.toString()}
								onChange={(e) =>
									updateSplit(
										index,
										"amount",
										TransactionAmount.fromString(
											e.target.value,
										).toNumber(),
									)
								}
								className="w-full! pl-6! pr-3! py-2! text-sm! border! border-gray-300! rounded-lg! focus:ring-1! focus:ring-indigo-500!"
							/>
						</div>
						{splits.length > 1 && (
							<button
								onClick={() => removeSplit(index)}
								className="p-2! text-gray-400! hover:text-rose-500! transition-colors!"
							>
								<Trash2 size={16} />
							</button>
						)}
					</div>
				))}
			</div>

			{!isBalanced && remaining > 0 && (
				<button
					onClick={addSplit}
					className="mt-3! text-sm! text-indigo-600! hover:text-indigo-700! font-medium! flex! items-center! gap-1!"
				>
					<Plus size={16} /> Add Split Account
				</button>
			)}
		</div>
	);
}
