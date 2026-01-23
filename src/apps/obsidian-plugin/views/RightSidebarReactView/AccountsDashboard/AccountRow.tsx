import { motion } from "framer-motion";
import { Check, Edit2, Trash2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
	Account,
	AccountAssetSubtype,
	AccountLiabilitySubtype,
	AccountSubtype,
} from "../../../../../contexts/Accounts/domain";
import { Nanoid } from "../../../../../contexts/Shared/domain";

interface AccountRowProps {
	account: Account;
	onUpdate: (
		id: Nanoid,
		updates: { name?: string; subtype?: AccountSubtype; amount?: number },
	) => void;
	onDelete: (id: Nanoid) => void;
}

export function AccountRow({
	account,
	onUpdate,
	onDelete,
}: Readonly<AccountRowProps>) {
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(account.name.value);
	const [editSubtype, setEditSubtype] = useState(account.subtype);
	const [editAmount, setEditAmount] = useState(
		account.balance.value.value.toString(),
	);
	const nameInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing && nameInputRef.current) {
			nameInputRef.current.focus();
		}
	}, [isEditing]);
	const handleSave = () => {
		const amount = Number.parseFloat(editAmount.replaceAll(",", ""));
		if (!Number.isNaN(amount) && editName.trim()) {
			onUpdate(account.id, {
				name: editName,
				subtype: editSubtype,
				amount,
			});
			setIsEditing(false);
		}
	};

	const handleCancel = () => {
		setEditName(account.name.value);
		setEditSubtype(account.subtype);
		setEditAmount(account.balance.value.value.toString());
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") handleSave();
		if (e.key === "Escape") handleCancel();
	};

	return (
		<motion.div
			layout
			initial={{
				opacity: 0,
				y: 10,
			}}
			animate={{
				opacity: 1,
				y: 0,
			}}
			exit={{
				opacity: 0,
				height: 0,
			}}
			className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0"
		>
			{isEditing ? (
				<div className="flex-1 flex items-center gap-4 w-full">
					<div className="flex flex-col gap-2 flex-1">
						<input
							ref={nameInputRef}
							type="text"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							onKeyDown={handleKeyDown}
							className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium"
							placeholder="Account Name"
						/>
						<select
							value={editSubtype}
							onChange={(e) =>
								setEditSubtype(e.target.value as AccountSubtype)
							}
							onKeyDown={handleKeyDown}
							className="w-full! px-3! py-1.5! border! border-indigo-200! rounded-md! focus:outline-none! focus:ring-2! focus:ring-indigo-500! bg-white! text-xs! text-gray-600!"
						>
							{account.type.isAsset() ? (
								<>
									<option value={AccountAssetSubtype.SAVINGS}>
										Savings
									</option>
									<option
										value={AccountAssetSubtype.CHECKING}
									>
										Checking
									</option>
									<option
										value={AccountAssetSubtype.INVESTMENT}
									>
										Investment
									</option>
									<option value={AccountAssetSubtype.CASH}>
										Cash
									</option>
								</>
							) : (
								<>
									<option
										value={
											AccountLiabilitySubtype.CREDIT_CARD
										}
									>
										Credit Card
									</option>
									<option
										value={AccountLiabilitySubtype.LOAN}
									>
										Loan
									</option>
								</>
							)}
						</select>
					</div>

					<div className="relative w-32 self-start mt-1">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
							{account.currency.symbol}
						</span>
						<input
							type="number"
							value={editAmount}
							onChange={(e) => setEditAmount(e.target.value)}
							onKeyDown={handleKeyDown}
							className="w-full pl-8 pr-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-right"
							placeholder="0.00"
						/>
					</div>

					<div className="flex items-center gap-1 self-start mt-1">
						<button
							onClick={handleSave}
							className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
							aria-label="Save changes"
						>
							<Check className="w-4 h-4" />
						</button>
						<button
							onClick={handleCancel}
							className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
							aria-label="Cancel editing"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>
			) : (
				<>
					<div className="flex items-center gap-3">
						<div
							className={`w-2 h-2 rounded-full flex-shrink-0 ${account.type.isAsset() ? "bg-emerald-400" : "bg-rose-400"}`}
						/>
						<div
							className="flex flex-col cursor-pointer group/name"
							onClick={() => setIsEditing(true)}
						>
							<span className="font-medium text-gray-900 group-hover/name:text-indigo-600 transition-colors">
								{account.name}
							</span>
							<span className="text-xs text-gray-500 group-hover/name:text-indigo-400 transition-colors">
								{account.subtype}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-6">
						<span
							className={`font-semibold tabular-nums cursor-pointer hover:text-indigo-600 transition-colors ${account.type.isAsset() ? "text-gray-900" : "text-rose-600"}`}
							onClick={() => setIsEditing(true)}
						>
							{account.type.isLiability() && "-"}
							{account.balance.value.toString()}
						</span>

						<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-16 justify-end">
							<button
								onClick={() => setIsEditing(true)}
								className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
								aria-label="Edit account"
							>
								<Edit2 className="w-3.5 h-3.5" />
							</button>
							<button
								onClick={() => onDelete(account.id)}
								className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
								aria-label="Delete account"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
				</>
			)}
		</motion.div>
	);
}
