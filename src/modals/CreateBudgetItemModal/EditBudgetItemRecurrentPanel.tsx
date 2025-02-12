import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { useContext, useMemo, useState } from "react";
import { BudgetItemRecordType } from "../../budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { Input } from "view/components/Input";
import { Select } from "view/components/Select";
import { SelectWithCreation } from "view/components/SelectWithCreation";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetContext } from "view/views/RightSidebarReactView/RightSidebarReactView";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { FrequencyString } from "budget/BudgetItem/FrequencyString";

export const EditBudgetItemRecurrentPanel = ({
	item,
	onEdit,
	onClose,
}: {
	item: BudgetItemRecurrent;
	onEdit: (item: BudgetItem) => Promise<void>;
	onClose: () => void;
}) => {
	const { budget } = useContext(BudgetContext);
	const categories = useMemo(() => budget.getCategories(), [budget]);

	const [name, setName] = useState(item.name);
	const [amount, setAmount] = useState(item.amount);
	const [type, setType] = useState(item.type);

	const [category, setCategory] = useState(item?.category || "");

	const [account, setAccount] = useState(item.account);

	const [frequency, setFrequency] = useState(String(item.frequency) || "");

	const [date, setDate] = useState(item.nextDate.toDate());
	const [validation, setValidation] = useState<
		Record<string, boolean> | undefined
	>(undefined);
	const validateOnUpdate = () => ({
		name: name.length > 0,
		amount: amount.toNumber() > 0,
		account: account.length > 0,
		date: date.toString() !== "Invalid Date",
		category: category.length > 0,
		frequency: frequency.length > 0,
	});

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Account Record</h3>
			<Input
				id="name"
				label="Name"
				value={name}
				onChange={(name: string) => setName(name)}
				error={!validation || validation.name ? undefined : "required"}
			/>
			<Input<PriceValueObject>
				id="amount"
				label="Amount"
				value={amount}
				onChange={setAmount}
				error={
					!validation || validation.amount ? undefined : "required"
				}
			/>
			{item instanceof BudgetItemSimple && (
				<Select
					id="type"
					label="Type"
					value={type}
					values={{
						expense: "Expense",
						transfer: "Transfer",
						income: "Income",
					}}
					onChange={(type) =>
						setType(type.toLowerCase() as BudgetItemRecordType)
					}
				/>
			)}
			<SelectWithCreation
				id="account"
				label="From"
				item={account}
				items={budget.getAccounts()}
				onChange={(account) => setAccount(account ?? "")}
				error={
					!validation || validation.account ? undefined : "required"
				}
			/>
			<SelectWithCreation
				id="category"
				label="Category"
				item={category}
				items={categories}
				onChange={(category) => setCategory(category ?? "")}
				error={
					!validation || validation.category ? undefined : "required"
				}
			/>
			<Input<Date>
				id="date"
				label="Date"
				value={date}
				onChange={setDate}
				error={!validation || validation.date ? undefined : "required"}
			/>
			<Input
				id="frequency"
				label="Frequency"
				value={frequency}
				onChange={(account) => setFrequency(account ?? "")}
				error={
					!validation || validation.toAccount ? undefined : "required"
				}
			/>
			<button
				onClick={async () => {
					const validation = validateOnUpdate();
					setValidation(validation);
					if (!Object.values(validation).every((value) => value))
						return;

					date.setSeconds(0);

					await onEdit(
						new BudgetItemRecurrent(
							item.id,
							name,
							account,
							amount.toNumber(),
							category,
							type,
							new BudgetItemNextDate(date, true),
							item.path,
							new FrequencyString(frequency),
							item.history
						)
					);

					onClose();
				}}
			>
				Create
			</button>
		</div>
	);
};
