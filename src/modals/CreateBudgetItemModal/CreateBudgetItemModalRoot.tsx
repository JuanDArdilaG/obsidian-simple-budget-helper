import { App, Modal } from "obsidian";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { createRoot, Root } from "react-dom/client";
import { StrictMode } from "react";
import { CreateBudgetItemModal } from "./CreateBudgetItemModal";
import { Budget } from "budget/Budget/Budget";

export class CreateBudgetItemModalRoot extends Modal {
	root: Root | null = null;
	constructor(
		app: App,
		budget: Budget<BudgetItem>,
		accounts: string[],
		onSubmit: (item: BudgetItem) => Promise<void>,
		toEdit?: BudgetItem
	) {
		super(app);

		this.root = createRoot(this.modalEl.children[1]);

		this.root?.render(
			<StrictMode>
				<CreateBudgetItemModal
					app={app}
					budget={budget}
					accounts={[...accounts, "-- create new --"].sort()}
					onSubmit={onSubmit}
					close={() => {
						this.close();
					}}
					toEdit={toEdit}
				/>
			</StrictMode>
		);
	}

	onClose(): void {
		super.onClose();
		this.root?.unmount();
	}
}
