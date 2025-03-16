import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetItemNextDate } from "./BudgetItemNextDate";
import {
	BudgetItemRecord,
	BudgetItemRecordType,
} from "./BugetItemRecord/BudgetItemRecord";
import { TBudgetItemRecurrent } from "./BudgetItemRecurrent";
import { TBudgetItemSimple } from "./BudgetItemSimple";
import { nanoid } from "nanoid";
import { Validator } from "./Validator";

export abstract class BudgetItem {
	constructor(
		protected _id: string,
		protected _name: string,
		protected _amount: number,
		protected _category: string,
		protected _subCategory: string,
		protected _brand: string,
		protected _store: string,
		protected _type: BudgetItemRecordType,
		protected _nextDate: BudgetItemNextDate,
		protected _account: string,
		protected _toAccount?: string
	) {}

	get id(): string {
		return this._id;
	}

	setRandomId() {
		this._id = nanoid();
	}

	get name(): string {
		return this._name;
	}

	get type(): BudgetItemRecordType {
		return this._type;
	}

	get toAccount(): string {
		return this._toAccount || "";
	}

	get amount(): PriceValueObject {
		return new PriceValueObject(this._amount);
	}

	get category(): string {
		return this._category;
	}

	get subCategory(): string {
		return this._subCategory;
	}

	get brand(): string {
		return this._brand;
	}

	get store(): string {
		return this._store;
	}

	get nextDate(): BudgetItemNextDate {
		return this._nextDate;
	}

	get account(): string {
		return this._account;
	}

	abstract get history(): BudgetItemRecord[];

	abstract get filePath(): string;

	get remainingDays(): { str: string; color: "green" | "yellow" | "red" } {
		const rd = this.nextDate.remainingDays;
		const str = rd === 1 || rd === -1 ? `${rd} day` : `${rd} days`;
		const absRd = Math.abs(rd);
		return {
			str,
			color: rd < -3 ? "red" : absRd <= 3 ? "yellow" : "green",
		};
	}

	update({
		name,
		amount,
		category,
		type,
		nextDate,
		account,
		toAccount,
	}: {
		name?: string;
		amount?: number;
		category?: string;
		type?: BudgetItemRecordType;
		nextDate?: BudgetItemNextDate;
		account?: string;
		toAccount?: string;
	}) {
		if (name) this._name = name;
		if (amount) this._amount = amount;
		if (category) this._category = category;
		if (type) this._type = type;
		if (nextDate) this._nextDate = nextDate;
		if (account) this._account = account;
		if (toAccount) this._toAccount = toAccount;
	}

	abstract record(
		date: Date,
		account: string,
		amount?: number,
		isPermanent?: boolean
	): void;

	abstract updateHistoryRecord(
		id: string,
		name: string,
		account: string,
		date: Date,
		type: BudgetItemRecordType,
		amount: number,
		category: string,
		subCategory: string
	): void;

	abstract removeHistoryRecord(id: string): void;

	abstract toJSON(): TBudgetItem;
}

export type TBudgetItem = TBudgetItemSimple & TBudgetItemRecurrent;

export class BudgetItemValidator extends Validator<TBudgetItem, BudgetItem> {
	constructor() {
		super({
			id: (value) => value.id !== "",
			name: (value) => value.name !== "",
			account: (value) => value.account !== "",
			amount: (value) => !value.amount.isZero(),
			nextDate: (value) => value.nextDate !== null,
			category: (value) => value.category !== "",
			subcategory: (value) => value.subCategory !== "",
			brand: (_) => true,
			store: (_) => true,
			toAccount: (value) =>
				value.type !== "transfer" || value.toAccount !== "",
			path: (_) => true,
			history: (_) => true,
			type: (_) => true,
			frequency: () => true,
		});
	}
}
