import { App, Modal } from "obsidian";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { createRoot, Root } from "react-dom/client";
import { StrictMode } from "react";
import { CreateBudgetItemModal } from "./CreateBudgetItemModal";

export class CreateBudgetItemModalRoot extends Modal {
	root: Root | null = null;
	constructor(
		id: number,
		app: App,
		categories: string[],
		onSubmit: (item: BudgetItem) => Promise<void>,
		toEdit?: BudgetItem
	) {
		super(app);

		this.root = createRoot(this.modalEl.children[1]);

		this.root?.render(
			<StrictMode>
				<CreateBudgetItemModal
					id={id}
					categories={categories}
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
