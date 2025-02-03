import { App, Modal } from "obsidian";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { createRoot, Root } from "react-dom/client";
import { StrictMode } from "react";
import { CreateBudgetItemModal } from "./CreateBudgetItemModal";
import { Budget } from "budget/Budget/Budget";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";

export class CreateBudgetItemModalRoot extends Modal {
	root: Root | null = null;
	constructor(
		app: App,
		budget: Budget<BudgetItem>,
		onSubmit: (item: BudgetItem) => Promise<void>,
		toEdit?: BudgetItem
	) {
		super(app);

		this.root = createRoot(this.modalEl.children[1]);

		this.root?.render(
			<StrictMode>
				<LocalizationProvider
					dateAdapter={AdapterDayjs}
					adapterLocale="es"
				>
					<CreateBudgetItemModal
						budget={budget}
						onSubmit={onSubmit}
						close={() => {
							this.close();
						}}
						toEdit={toEdit}
					/>
				</LocalizationProvider>
			</StrictMode>
		);
	}

	onClose(): void {
		super.onClose();
		this.root?.unmount();
	}
}
