import { useEffect, useState } from "react";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { FrequencyString } from "budget/BudgetItem/FrequencyString";
import { ReactMoneyInput } from "react-input-price";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { BudgetItemRecordType } from "budget/BudgetItem/BudgetItemRecord";
import { App, Notice, SuggestModal } from "obsidian";
import { Budget } from "budget/Budget/Budget";

export const CreateBudgetItemModal = ({
	app,
	budget,
	accounts,
	onSubmit,
	close,
	toEdit,
}: {
	app: App;
	budget: Budget<BudgetItem>;
	accounts: string[];
	onSubmit: (item: BudgetItem) => Promise<void>;
	close: () => void;
	toEdit?: BudgetItem;
}) => {
	const [selectedItem, setSelectedItem] = useState<BudgetItem | undefined>(
		undefined
	);

	const [account, setAccount] = useState("-- create new --");
	const [newAccount, setNewAccount] = useState("");

	const [toAccount, setToAccount] = useState("-- create new --");
	const [newToAccount, setNewToAccount] = useState("");

	const [name, setName] = useState("");
	const [amount, setAmount] = useState(0);
	const [isRecurrent, setIsRecurrent] = useState(false);
	const [frequency, setFrequency] = useState("");
	const [category, setCategory] = useState("-- create new --");
	const [newCategory, setNewCategory] = useState("");
	const [type, setType] = useState("income" as BudgetItemRecordType);
	const [nextDate, setNextDate] = useState(new Date());
	const [time, setTime] = useState(
		new Date().toTimeString().split(" ")[0].split(":").slice(0, 2).join(":")
	);

	useEffect(() => {
		if (selectedItem) {
			loadFromItem(selectedItem);
		}
	}, [selectedItem]);

	const [suggestionsModal, setSuggestionsModal] = useState(
		new ItemsSuggestionModal(app, budget.items, setSelectedItem)
	);

	useEffect(() => {
		setSuggestionsModal(
			new ItemsSuggestionModal(app, budget.items, setSelectedItem)
		);
	}, [budget.items]);

	const loadFromItem = (item: BudgetItem) => {
		setName(item.name);
		setAccount(
			item instanceof BudgetItemSimple ? item.account : "-- create new --"
		);
		setIsRecurrent(item instanceof BudgetItemRecurrent);
		setFrequency(
			item instanceof BudgetItemRecurrent ? item.frequency.toString() : ""
		);
		setAmount(item.amount);
		setCategory(item.category);
		setType(item.type);
		// setNextDate(item.nextDate);
		// setTime(
		// 	item.nextDate
		// 		.toTimeString()
		// 		.split(" ")[0]
		// 		.split(":")
		// 		.slice(0, 2)
		// 		.join(":")
		// );
	};

	useEffect(() => {
		if (toEdit) {
			loadFromItem(toEdit);
		}
	}, [toEdit]);

	return (
		<div className="create-budget-item-modal">
			<h1>Create Budget Item</h1>
			<button
				onClick={() => {
					suggestionsModal.open();
				}}
			>
				From Item
			</button>
			<input
				type="text"
				placeholder="Name"
				defaultValue={name}
				onChange={(e) => setName(e.target.value)}
			/>
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<select
					value={account}
					onChange={(e) => setAccount(e.target.value)}
				>
					{accounts.map((account, index) => (
						<option value={account} key={index}>
							{account}
						</option>
					))}
				</select>
				{account === "-- create new --" && (
					<input
						type="text"
						onChange={(e) => setNewAccount(e.target.value)}
					/>
				)}
			</div>
			<ReactMoneyInput
				id="amount-input-react"
				value={amount}
				onValueChange={(priceVO) => setAmount(priceVO.toNumber())}
			/>
			<select
				value={type}
				onChange={(e) =>
					setType(e.target.value as BudgetItemRecordType)
				}
			>
				<option value="income">Income</option>
				<option value="expense">Expense</option>
				<option value="transfer">Transfer</option>
			</select>
			{type === "transfer" && (
				<div
					style={{ display: "flex", justifyContent: "space-between" }}
				>
					<select
						value={toAccount}
						onChange={(e) => setToAccount(e.target.value)}
					>
						{accounts.map((account, index) => (
							<option value={account} key={index}>
								{account}
							</option>
						))}
					</select>
					{toAccount === "-- create new --" && (
						<input
							type="text"
							onChange={(e) => setNewToAccount(e.target.value)}
						/>
					)}
				</div>
			)}
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<select
					value={category}
					onChange={(e) => setCategory(e.target.value)}
				>
					{[...budget.getCategories(), "-- create new --"]
						.sort()
						.map((category, index) => (
							<option value={category} key={index}>
								{category}
							</option>
						))}
				</select>
				{category === "-- create new --" && (
					<input
						type="text"
						onChange={(e) => setNewCategory(e.target.value)}
					/>
				)}
			</div>
			<div>
				<input
					type="date"
					value={new Intl.DateTimeFormat("en-CA", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
					}).format(nextDate)}
					onChange={(e) =>
						setNextDate(new Date(`${e.target.value}T00:00:00`))
					}
				/>
				<input
					type="time"
					value={time}
					onChange={(e) => setTime(e.target.value)}
				/>
			</div>
			<div>
				<input
					id="isRecurrent"
					type="checkbox"
					checked={isRecurrent}
					onChange={(e) => setIsRecurrent(e.target.checked)}
				/>
				<label htmlFor="isRecurrent">Recurrent</label>
			</div>
			{isRecurrent && (
				<input
					type="text"
					placeholder="Frequency"
					value={frequency}
					onChange={(e) => setFrequency(e.target.value)}
				/>
			)}
			<button
				onClick={() => {
					const isRecurrent = frequency !== "";
					nextDate.setHours(parseInt(time.split(":")[0]));
					nextDate.setMinutes(parseInt(time.split(":")[1]));
					nextDate.setSeconds(0);
					const date = new BudgetItemNextDate(nextDate, isRecurrent);
					const cat =
						category === "-- create new --"
							? newCategory
							: category;
					const acc =
						account === "-- create new --" ? newAccount : account;
					const toAcc =
						toAccount === "-- create new --"
							? newToAccount
							: toAccount;

					onSubmit(
						isRecurrent
							? BudgetItemRecurrent.create(
									name,
									amount,
									cat,
									type,
									date,
									new FrequencyString(frequency),
									"",
									toAcc
							  )
							: BudgetItemSimple.create(
									acc,
									name,
									amount,
									cat,
									type,
									date,
									toAcc
							  )
					);
					close();
				}}
			>
				Create
			</button>
		</div>
	);
};

class ItemsSuggestionModal extends SuggestModal<BudgetItem> {
	constructor(
		app: App,
		private _items: BudgetItem[],
		private _setSelection: React.Dispatch<
			React.SetStateAction<BudgetItem | undefined>
		>
	) {
		super(app);
		this._items = this._items.sort((a, b) => a.name.localeCompare(b.name));
	}

	// Returns all available suggestions.
	getSuggestions(query: string): BudgetItem[] {
		return this._items.filter((item) =>
			item.name.toLowerCase().includes(query.toLowerCase())
		);
	}

	// Renders each suggestion item.
	renderSuggestion(item: BudgetItem, el: HTMLElement) {
		el.createEl("div", { text: item.name });
		//   el.createEl('small', { text: book.author });
	}

	// Perform action on the selected suggestion.
	onChooseSuggestion(item: BudgetItem, evt: MouseEvent | KeyboardEvent) {
		new Notice(`Selected ${item.name}`);
		this._setSelection(item);
	}
}
