import { App, Modal } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { StrictMode } from "react";
import { RecordBudgetItemModal } from "./RecordBudgetItemModal";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";

export class RecordBudgetItemModalRoot extends Modal {
	root: Root | null = null;
	constructor(
		app: App,
		private _budgetItem: BudgetItem,
		onRecord: (item: BudgetItem) => void
	) {
		super(app);

		this.root = createRoot(this.modalEl.children[1]);

		this.root?.render(
			<StrictMode>
				<RecordBudgetItemModal
					item={this._budgetItem}
					onRecord={onRecord}
					onClose={() => this.close()}
				/>
			</StrictMode>
		);
	}

	onClose(): void {
		super.onClose();
		this.root?.unmount();
	}
}
