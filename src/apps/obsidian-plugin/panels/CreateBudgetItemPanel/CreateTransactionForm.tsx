import { useContext, useEffect, useState, PropsWithChildren } from "react";
import { PriceValueObject } from "@juandardilag/value-objects";
import {
	Transaction,
	TransactionID,
	TransactionPrimitives,
	TransactionAmount,
} from "contexts/Transactions/domain";
import {
	AccountsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	Select,
	SelectWithCreation,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import { OperationType } from "contexts/Shared/domain";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { AccountID } from "contexts/Accounts/domain";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { ButtonGroup, Button } from "@mui/material";
import { CreateCategoryModal } from "apps/obsidian-plugin/Category/CreateCategoryModal";

export const CreateTransactionForm = ({
	items,
	close,
	children,
	onCreate,
}: PropsWithChildren<{
	items: Transaction[];
	close: () => void;
	onCreate: () => void;
}>) => {
	const { logger } = useLogger("CreateTransactionForm");

	const {
		brands,
		stores,
		updateBrands,
		updateStores,
		updateTransactions,
		useCases: { recordTransaction },
	} = useContext(TransactionsContext);
	const { getAccountByID, updateAccounts } = useContext(AccountsContext);

	const [locks, setLocks] = useState<{
		[K in keyof Omit<
			Required<TransactionPrimitives>,
			"id" | "item"
		>]: boolean;
	}>({
		account: false,
		toAccount: false,
		category: false,
		subCategory: false,
		amount: false,
		name: false,
		date: false,
		operation: false,
		brand: false,
		store: false,
	});

	const updateLock = (key: keyof TransactionPrimitives, value: boolean) => {
		setLocks({
			...locks,
			[key]: value,
		});
	};
	const [transaction, setTransaction] = useState<TransactionPrimitives>(
		Transaction.emptyPrimitives()
	);
	const [selectedTransaction, setSelectedTransaction] =
		useState<TransactionPrimitives>(Transaction.emptyPrimitives());

	const { DateInput, date } = useDateInput({
		id: "date",
		lock: locks.date,
		setLock: (lock) => updateLock("date", lock),
	});
	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: transaction.account,
		lock: locks.account,
		setLock: (lock) => updateLock("account", lock),
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: transaction.toAccount,
			lock: locks.toAccount,
			setLock: (lock) => updateLock("toAccount", lock),
		});
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: transaction.category,
		lock: locks.category,
		setLock: (lock) => updateLock("category", lock),
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: transaction.subCategory,
		lock: locks.subCategory,
		setLock: (lock) => updateLock("subCategory", lock),
	});

	const getLockedOrSelectedValue = <T,>(
		key: keyof Omit<TransactionPrimitives, "id" | "item">
	): T | undefined => {
		if (locks[key]) return transaction[key] as T;
		return (selectedTransaction?.[key] as T) ?? undefined;
	};

	const [openCreateCategoryModal, setOpenCreateCategoryModal] =
		useState(false);

	useEffect(() => {
		if (selectedTransaction) {
			logger.debug("selected item on creation", {
				selectedTransaction,
				locks,
			});

			const toUpdate: Partial<TransactionPrimitives> = {
				name: getLockedOrSelectedValue("name"),
				operation: getLockedOrSelectedValue("operation"),
				amount: getLockedOrSelectedValue("amount"),
				category: getLockedOrSelectedValue("category"),
				subCategory: getLockedOrSelectedValue("subCategory"),
				brand: getLockedOrSelectedValue("brand"),
				store: getLockedOrSelectedValue("store"),
				account: getLockedOrSelectedValue("account"),
				toAccount: getLockedOrSelectedValue("toAccount"),
			};

			logger.debug("item to update on creation", {
				toUpdate,
			});

			update(toUpdate);
		}
	}, [selectedTransaction]);

	const update = (newValues: Partial<TransactionPrimitives>) => {
		const newTransaction = { ...transaction };
		logger.debug("updating item to create", {
			prevValues: newTransaction,
			newValues,
		});
		if (newValues.name !== undefined) newTransaction.name = newValues.name;
		if (newValues.operation !== undefined)
			newTransaction.operation = newValues.operation;
		if (newValues.amount !== undefined)
			newTransaction.amount = newValues.amount;
		if (newValues.category !== undefined)
			newTransaction.category = newValues.category;
		if (newValues.subCategory !== undefined)
			newTransaction.subCategory = newValues.subCategory;
		if (newValues.brand !== undefined)
			newTransaction.brand = newValues.brand;
		if (newValues.store !== undefined)
			newTransaction.store = newValues.store;
		if (newValues.toAccount) newTransaction.toAccount = newValues.toAccount;
		if (newValues.account !== undefined)
			newTransaction.account = newValues.account;

		logger.debug("item to create updated", {
			newTransaction,
		});

		setTransaction(newTransaction);
	};

	const handleSubmit = (withClose: boolean) => async () => {
		if (!transaction) return;

		const itemToPersist = Transaction.fromPrimitives({
			...transaction,
			id: TransactionID.generate().value,
			category: category?.id.value ?? "",
			subCategory: subCategory?.id.value ?? "",
			account: account?.id.value ?? "",
			toAccount: toAccount?.id.value,
			date,
		});

		await recordTransaction.execute(itemToPersist);

		updateTransactions();
		updateAccounts();
		updateBrands();
		updateStores();

		onCreate();

		if (withClose) return close();
		setSelectedTransaction(Transaction.emptyPrimitives());
		setTransaction({
			id: "",
			account: locks.account ? transaction.account : "",
			name: locks.name ? transaction.name : "",
			amount: locks.amount ? transaction.amount : 0,
			category: locks.category ? transaction.category : "",
			subCategory: locks.subCategory ? transaction.subCategory : "",
			brand: locks.brand ? transaction.brand : "",
			store: locks.store ? transaction.store : "",
			operation: locks.operation ? transaction.operation : "expense",
			toAccount: locks.toAccount ? transaction.toAccount : "",
			date,
		});
	};

	return (
		<div className="create-budget-item-modal">
			<h1>Create Transaction</h1>

			<SelectWithCreation<TransactionPrimitives>
				id="name"
				label="Name"
				item={selectedTransaction}
				items={items.map((item) => item.toPrimitives())}
				getLabel={(item) => {
					if (!item.id) return "";
					const label = `${item.name} - ${
						item.account
							? getAccountByID(new AccountID(item.account))?.name
									.value + " - "
							: ""
					}${
						item.operation === "transfer" && item.toAccount
							? ` -> ${
									getAccountByID(
										new AccountID(item.toAccount)
									)?.name.value
							  } - `
							: ""
					}${
						!item.amount
							? ""
							: "  " +
							  new TransactionAmount(item.amount).toString()
					}`;
					return label;
				}}
				getKey={(item) => item.name}
				setSelectedItem={(item) =>
					setSelectedTransaction(
						item ?? Transaction.emptyPrimitives()
					)
				}
				onChange={(name) => update({ name })}
				isLocked={locks.name}
				setIsLocked={(value) => updateLock("name", value)}
				// error={validation.check("name") ?? undefined}
			/>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: "5px",
				}}
			>
				{DateInput}
				<PriceInput
					id="amount"
					value={
						new PriceValueObject(transaction.amount, {
							withSign: false,
							decimals: 0,
						})
					}
					onChange={(amount) => update({ amount: amount.value })}
					isLocked={locks.amount}
					setIsLocked={(value) => updateLock("amount", value)}
					label="Amount"
				/>
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				{CategorySelect}
				{SubCategorySelect}
				<Button onClick={() => setOpenCreateCategoryModal(true)}>
					Create
				</Button>
				<CreateCategoryModal
					open={openCreateCategoryModal}
					onClose={() => setOpenCreateCategoryModal(false)}
					onCreate={() => {
						updateAccounts();
						setOpenCreateCategoryModal(false);
					}}
				/>
			</div>
			<Select
				id="type"
				label="Type"
				value={transaction.operation}
				values={["expense", "income", "transfer"]}
				onChange={(operation) => {
					update({
						operation: operation.toLowerCase() as OperationType,
					});
				}}
				isLocked={locks.operation}
				setIsLocked={(value) => updateLock("operation", value)}
				// error={errors?.operation}
			/>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: "10px",
				}}
			>
				{AccountSelect}
				{transaction.operation === "transfer" && ToAccountSelect}
			</div>
			{transaction.operation === "expense" && (
				<div
					style={{ display: "flex", justifyContent: "space-between" }}
				>
					<SelectWithCreation
						id="brand"
						label="Brand"
						item={transaction.brand ?? ""}
						items={brands.map((brand) => brand.value)}
						onChange={(brand) => update({ brand })}
						isLocked={locks.brand}
						setIsLocked={(value) => updateLock("brand", value)}
						// error={validation.check("brand") ?? undefined}
					/>
					<SelectWithCreation
						id="store"
						label="Store"
						style={{ flexGrow: 1 }}
						item={transaction.store ?? ""}
						items={stores.map((store) => store.value)}
						onChange={(store) => update({ store })}
						isLocked={locks.store}
						setIsLocked={(value) => updateLock("store", value)}
						// error={validation.check("store") ?? undefined}
					/>
				</div>
			)}
			{children}
			<ButtonGroup
				variant="contained"
				aria-label="Save Buttons"
				style={{
					display: "flex",
					justifyContent: "center",
					marginTop: 30,
				}}
			>
				<Button onClick={handleSubmit(false)}>
					Save & Create Another
				</Button>
				<Button onClick={handleSubmit(true)}>Save & Finish</Button>
			</ButtonGroup>
		</div>
	);
};
