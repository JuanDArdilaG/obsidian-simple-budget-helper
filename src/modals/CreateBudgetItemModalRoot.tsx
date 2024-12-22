import { App, Modal } from "obsidian";
import { BudgetItem } from "src/budget/BudgetItem";
import { createRoot, Root } from "react-dom/client";
import { StrictMode } from "react";
import { CreateBudgetItemModal } from "./CreateBudgetItemModal";

export class CreateBudgetItemModalRoot extends Modal {
	root: Root | null = null;
	constructor(
		app: App,
		categories: string[],
		onSubmit: (item: BudgetItem) => Promise<void>
	) {
		super(app);

		this.root = createRoot(this.modalEl.children[1]);

		this.root?.render(
			<StrictMode>
				<CreateBudgetItemModal
					categories={categories}
					onSubmit={onSubmit}
					close={() => {
						this.close();
					}}
				/>
			</StrictMode>
		);
	}

	onClose(): void {
		super.onClose();
		this.root?.unmount();
	}
}
