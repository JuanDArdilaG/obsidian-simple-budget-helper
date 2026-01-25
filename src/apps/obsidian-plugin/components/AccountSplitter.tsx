import { Plus, Trash2, Wallet } from "lucide-react";
import { AccountsMap } from "../../../contexts/Accounts/application/get-all-accounts.usecase";
import { Nanoid } from "../../../contexts/Shared/domain";
import {
	AccountSplit,
	TransactionAmount,
} from "../../../contexts/Transactions/domain";

export function AccountSplitter({
	label,
	splits,
	onChange,
	accountsMap,
	totalAmount,
}: Readonly<{
	label: string;
	splits: AccountSplit[];
	onChange: (splits: AccountSplit[]) => void;
	accountsMap: AccountsMap;
	totalAmount: number;
}>) {
	const currentTotal = splits.reduce((sum, s) => sum + s.amount.value, 0);
	const remaining = totalAmount - currentTotal;
	const isBalanced = Math.abs(remaining) < 0.01;
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
				new TransactionAmount(remaining > 0 ? remaining : 0),
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
	return (
		<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
			<div className="flex justify-between items-center mb-3">
				<div className="flex items-center gap-2">
					<Wallet size={16} className="text-gray-500" />
					<span className="font-medium text-gray-700">{label}</span>
				</div>
				<div
					className={`text-sm font-medium ${isBalanced ? "text-green-600" : "text-amber-600"}`}
				>
					{isBalanced ? (
						<span className="flex items-center gap-1">
							Match{" "}
							<div className="w-2 h-2 rounded-full bg-green-500" />
						</span>
					) : (
						<span>
							{remaining > 0 ? "Remaining: " : "Over: "}
							{new Intl.NumberFormat("en-US", {
								style: "currency",
								currency: "USD",
							}).format(Math.abs(remaining))}
						</span>
					)}
				</div>
			</div>

			<div className="space-y-2">
				{splits.map((split, index) => (
					<div
						key={split.accountId.value}
						className="flex gap-2 items-center"
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
						<div className="relative w-32">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
								$
							</span>
							<input
								type="number"
								value={split.amount.value}
								onChange={(e) =>
									updateSplit(
										index,
										"amount",
										Number.parseFloat(e.target.value),
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
