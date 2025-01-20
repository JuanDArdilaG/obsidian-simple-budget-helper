import { App, Modal } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { StrictMode } from "react";
import { EditBudgetItemRecordModal } from "./EditBudgetItemRecordModal";
import { BudgetItemRecord } from "budget/BudgetItem/BudgetItemRecord";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";

export class EditBudgetItemRecordModalRoot extends Modal {
	root: Root | null = null;
	private _record: BudgetItemRecord;

	constructor(
		app: App,
		private _budget: Budget<BudgetItem>,
		private _onUpdate: (item: BudgetItem) => Promise<void>,
		private _categories: string[]
	) {
		super(app);
	}

	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]);
		this.refresh();
	}

	async refresh() {
		this.root?.render(
			<StrictMode>
				<EditBudgetItemRecordModal
					categories={[
						...this._categories,
						"-- create new --",
					].sort()}
					budget={this._budget}
					onUpdate={this._onUpdate}
					close={() => {
						this.close();
					}}
					record={this._record}
				/>
			</StrictMode>
		);
	}

	setRecord(record: BudgetItemRecord) {
		this._record = record;
	}

	onClose(): void {
		super.onClose();
		this.root?.unmount();
	}
}
