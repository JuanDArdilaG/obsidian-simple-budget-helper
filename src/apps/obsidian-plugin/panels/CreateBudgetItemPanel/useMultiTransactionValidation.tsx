import { useState } from "react";
import { OperationType } from "../../../../contexts/Shared/domain";
import { AccountSplitPrimitives } from "../../../../contexts/Transactions/domain";

interface ValidationErrors {
	items?: string;
	date?: string;
	operation?: string;
	fromSplits?: string;
	toSplits?: string;
	exchangeRate?: string;
	general?: string;
}

interface TransactionItem {
	id: string;
	name: string;
	amount: number;
	quantity: number;
	category: string;
	subCategory: string;
}

export const useMultiTransactionValidation = (
	items: TransactionItem[],
	date: Date,
	operation: OperationType,
	fromSplits: AccountSplitPrimitives[],
	toSplits: AccountSplitPrimitives[],
	exchangeRate?: number,
) => {
	const [errors, setErrors] = useState<ValidationErrors>({});

	const validate = (): boolean => {
		const newErrors: ValidationErrors = {};

		if (
			operation === "transfer" &&
			fromSplits.length > 0 &&
			toSplits.length > 0 &&
			fromSplits[0].currency !== toSplits[0].currency &&
			(!exchangeRate || exchangeRate <= 0)
		) {
			newErrors.exchangeRate = "Exchange rate must be greater than zero";
		}

		// Items validation
		if (!items || items.length === 0) {
			newErrors.items = "At least one transaction item is required";
		}

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (!item.name || item.name.trim() === "") {
				newErrors.items = `Transaction ${i + 1}: Name is required`;
				break;
			}
			if (item.name.length < 2) {
				newErrors.items = `Transaction ${
					i + 1
				}: Name must be at least 2 characters`;
				break;
			}
			if (item.name.length > 100) {
				newErrors.items = `Transaction ${
					i + 1
				}: Name must be less than 100 characters`;
				break;
			}
			if (!item.category || item.category.trim() === "") {
				newErrors.items = `Transaction ${i + 1}: Category is required`;
				break;
			}
			if (!item.subCategory || item.subCategory.trim() === "") {
				newErrors.items = `Transaction ${
					i + 1
				}: Subcategory is required`;
				break;
			}
			if (item.amount <= 0) {
				newErrors.items = `Transaction ${
					i + 1
				}: Amount must be greater than 0`;
				break;
			}
			if (item.quantity < 1) {
				newErrors.items = `Transaction ${
					i + 1
				}: Quantity must be at least 1`;
				break;
			}
			if (!Number.isInteger(item.quantity)) {
				newErrors.items = `Transaction ${
					i + 1
				}: Quantity must be a whole number`;
				break;
			}
		}

		// Date validation
		if (!date || Number.isNaN(date.getTime())) {
			newErrors.date = "Valid date is required";
		} else {
			const now = new Date();
			const futureLimit = new Date(
				now.getFullYear() + 10,
				now.getMonth(),
				now.getDate(),
			);
			const pastLimit = new Date(
				now.getFullYear() - 10,
				now.getMonth(),
				now.getDate(),
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
			!operation ||
			!["expense", "income", "transfer"].includes(operation)
		) {
			newErrors.operation = "Valid operation type is required";
		}

		// FromSplits validation
		if (!fromSplits || fromSplits.length === 0) {
			newErrors.fromSplits = "At least one from account is required";
		}

		// ToSplits validation (only for transfers)
		if (operation === "transfer" && (!toSplits || toSplits.length === 0)) {
			newErrors.toSplits =
				"At least one to account is required for transfers";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const getFieldError = (
		field: keyof ValidationErrors,
	): string | undefined => {
		return errors[field];
	};

	const clearErrors = () => {
		setErrors({});
	};

	return { validate, getFieldError, clearErrors, errors };
};
