import { Button, ButtonGroup } from "@mui/material";
import { CreateCategoryModal } from "apps/obsidian-plugin/Category/CreateCategoryModal";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import {
	Select,
	SelectWithCreation,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import {
	AccountsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AccountID } from "contexts/Accounts/domain";
import { OperationType } from "contexts/Shared/domain";
import {
	Transaction,
	TransactionID,
	TransactionPrimitives,
} from "contexts/Transactions/domain";
import React, {
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";

// Validation interface
interface ValidationErrors {
	name?: string;
	calculation?: string;
	category?: string;
	subCategory?: string;
	date?: string;
	operation?: string;
	brand?: string;
	store?: string;
}

// Validation hook
const useTransactionValidation = (
	transaction: TransactionPrimitives,
	date: Date
) => {
	const [errors, setErrors] = useState<ValidationErrors>({});

	const validate = (): boolean => {
		const newErrors: ValidationErrors = {};

		// Name validation
		if (!transaction.name || transaction.name.trim() === "") {
			newErrors.name = "Transaction name is required";
		} else if (transaction.name.length < 2) {
			newErrors.name = "Transaction name must be at least 2 characters";
		} else if (transaction.name.length > 100) {
			newErrors.name =
				"Transaction name must be less than 100 characters";
		}

		// Category validation
		if (!transaction.category || transaction.category.trim() === "") {
			newErrors.category = "Category is required";
		}

		// SubCategory validation
		if (!transaction.subCategory || transaction.subCategory.trim() === "") {
			newErrors.subCategory = "Subcategory is required";
		}

		// Date validation
		if (!date || isNaN(date.getTime())) {
			newErrors.date = "Valid date is required";
		} else {
			const now = new Date();
			const futureLimit = new Date(
				now.getFullYear() + 10,
				now.getMonth(),
				now.getDate()
			);
			const pastLimit = new Date(
				now.getFullYear() - 10,
				now.getMonth(),
				now.getDate()
			);

			if (date > futureLimit) {
				newErrors.date =
					"Date cannot be more than 10 years in the future";
			} else if (date < pastLimit) {
				newErrors.date =
					"Date cannot be more than 10 years in the past";
			}
		}

		// Operation validation
		if (
			!transaction.operation ||
			!["expense", "income", "transfer"].includes(transaction.operation)
		) {
			newErrors.operation = "Valid operation type is required";
		}

		// Brand validation (only for expenses)
		if (transaction.operation === "expense" && transaction.brand) {
			if (transaction.brand.length > 50) {
				newErrors.brand = "Brand name must be less than 50 characters";
			}
		}

		// Store validation (only for expenses)
		if (transaction.operation === "expense" && transaction.store) {
			if (transaction.store.length > 50) {
				newErrors.store = "Store name must be less than 50 characters";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const getFieldError = (
		field: keyof ValidationErrors
	): string | undefined => {
		return errors[field];
	};

	const clearErrors = () => {
		setErrors({});
	};

	return {
		validate,
		getFieldError,
		clearErrors,
		errors,
	};
};

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
		updateBrands,
		updateStores,
		updateTransactions,
		useCases: { recordTransaction },
	} = useContext(TransactionsContext);
	const { getAccountByID, updateAccounts } = useContext(AccountsContext);

	const [locks, setLocks] = useState<{
		fromSplits: boolean;
		toSplits: boolean;
		category: boolean;
		subCategory: boolean;
		date: boolean;
		operation: boolean;
		brand: boolean;
		store: boolean;
		updatedAt: boolean;
		name: boolean;
	}>({
		fromSplits: false,
		toSplits: false,
		category: false,
		subCategory: false,
		date: false,
		operation: false,
		brand: false,
		store: false,
		updatedAt: false,
		name: false,
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

	const { DateInput: DateInputBase, date } = useDateInput({
		id: "date",
		lock: locks.date,
		setLock: (lock) => updateLock("date", lock),
	});

	// Initialize validation with the actual date
	const { validate, getFieldError, clearErrors } = useTransactionValidation(
		transaction,
		date
	);

	// Create DateInput with error prop
	const DateInput = React.cloneElement(DateInputBase, {
		error: getFieldError("date"),
	});

	const { CategorySelect, category } = useCategorySelect({
		initialValueID: transaction.category,
		lock: locks.category,
		setLock: (lock) => updateLock("category", lock),
		error: getFieldError("category"),
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: transaction.subCategory,
		lock: locks.subCategory,
		setLock: (lock) => updateLock("subCategory", lock),
		error: getFieldError("subCategory"),
	});

	const getLockedOrSelectedValue = <T,>(
		key: keyof typeof locks
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
				category: getLockedOrSelectedValue("category"),
				subCategory: getLockedOrSelectedValue("subCategory"),
				brand: getLockedOrSelectedValue("brand"),
				store: getLockedOrSelectedValue("store"),
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
		if (newValues.category !== undefined)
			newTransaction.category = newValues.category;
		if (newValues.subCategory !== undefined)
			newTransaction.subCategory = newValues.subCategory;
		if (newValues.brand !== undefined)
			newTransaction.brand = newValues.brand;
		if (newValues.store !== undefined)
			newTransaction.store = newValues.store;

		logger.debug("item to create updated", {
			newTransaction,
		});

		setTransaction(newTransaction);
	};

	const handleSubmit = (withClose: boolean) => async () => {
		if (!transaction) return;

		// Validate before submission
		if (!validate()) {
			logger.debug("Validation failed");
			return;
		}

		try {
			const itemToPersist = Transaction.fromPrimitives({
				...transaction,
				id: TransactionID.generate().value,
				category: category?.id.value ?? "",
				subCategory: subCategory?.id.value ?? "",
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
				name: locks.name ? transaction.name : "",
				category: locks.category ? transaction.category : "",
				subCategory: locks.subCategory ? transaction.subCategory : "",
				brand: locks.brand ? transaction.brand : "",
				store: locks.store ? transaction.store : "",
				operation: locks.operation ? transaction.operation : "expense",
				date,
				updatedAt: new Date().toISOString(),
			});
			clearErrors();
		} catch (error) {
			logger.error(
				error instanceof Error
					? error
					: new Error("Error creating transaction")
			);
		}
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
					const fromAccounts = (item.fromSplits || [])
						.map(
							(s) =>
								getAccountByID(new AccountID(s.accountId))?.name
									.value || ""
						)
						.join(", ");
					const toAccounts = (item.toSplits || [])
						.map(
							(s) =>
								getAccountByID(new AccountID(s.accountId))?.name
									.value || ""
						)
						.join(", ");
					const totalFrom = (item.fromSplits || []).reduce(
						(sum, s) => sum + (s.amount || 0),
						0
					);
					const totalTo = (item.toSplits || []).reduce(
						(sum, s) => sum + (s.amount || 0),
						0
					);
					return `${item.name} - From: ${fromAccounts} ($${totalFrom}) To: ${toAccounts} ($${totalTo})`;
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
				error={getFieldError("name")}
			/>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: "5px",
					alignItems: "flex-end",
				}}
			>
				{DateInput}
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
				error={getFieldError("operation")}
			/>
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
