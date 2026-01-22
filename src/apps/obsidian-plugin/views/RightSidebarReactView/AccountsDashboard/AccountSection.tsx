import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import {
	Account,
	AccountSubtype,
} from "../../../../../contexts/Accounts/domain";
import { Nanoid } from "../../../../../contexts/Shared/domain";
import { AccountRow } from "./AccountRow";

interface AccountSectionProps {
	title: string;
	type: "asset" | "liability";
	accounts: Account[];
	onUpdate: (
		id: Nanoid,
		updates: { name?: string; subtype?: AccountSubtype; amount?: number },
	) => Promise<void>;
	onDelete: (id: Nanoid) => Promise<void>;
	onAdd: (type: "asset" | "liability") => void;
}
export function AccountSection({
	title,
	type,
	accounts,
	onUpdate,
	onDelete,
	onAdd,
}: Readonly<AccountSectionProps>) {
	const [isOpen, setIsOpen] = useState(true);
	const total = accounts.reduce((sum, acc) => sum + acc.convertedBalance, 0);
	return (
		<div className="bg-white! rounded-xl! shadow-sm! border! border-gray-100! overflow-hidden! mb-6!">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full! flex items-center! justify-between! p-6! hover:bg-gray-50! transition-colors! focus:outline-none! focus:bg-gray-50!"
			>
				<div className="flex items-center gap-3">
					<motion.div
						animate={{
							rotate: isOpen ? 180 : 0,
						}}
						transition={{
							duration: 0.2,
						}}
						className="text-gray-400"
					>
						<ChevronDown className="w-5 h-5" />
					</motion.div>
					<h2 className="text-lg font-semibold text-gray-900">
						{title}
					</h2>
					<span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
						{accounts.length}
					</span>
				</div>
				<div className="text-lg font-bold text-gray-900">
					{type === "liability" && "-"}
					{new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "USD",
						minimumFractionDigits: 0,
					}).format(total)}
				</div>
			</button>

			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						initial={{
							height: 0,
							opacity: 0,
						}}
						animate={{
							height: "auto",
							opacity: 1,
						}}
						exit={{
							height: 0,
							opacity: 0,
						}}
						transition={{
							duration: 0.3,
							ease: "easeInOut",
						}}
					>
						<div className="px-6 pb-6">
							<div className="border-t border-gray-100">
								{accounts.length > 0 ? (
									accounts
										.toSorted(
											(a, b) =>
												b.convertedBalance -
												a.convertedBalance,
										)
										.map((account) => (
											<AccountRow
												key={account.id.value}
												account={account}
												onUpdate={onUpdate}
												onDelete={onDelete}
											/>
										))
								) : (
									<div className="py-8 text-center text-gray-400 text-sm italic">
										No {type}s added yet.
									</div>
								)}
							</div>

							<button
								onClick={() => onAdd(type)}
								className="mt-4 w-full py-3 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
							>
								<Plus className="w-4 h-4" />
								Add {type === "asset" ? "Asset" : "Liability"}
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
