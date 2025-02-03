import { App, Modal } from "obsidian";

export class ConfirmationModal extends Modal {
	constructor(app: App, onSubmit: (result: boolean) => void) {
		super(app);
		this.setTitle("Are you sure?");

		const cancelBtn = this.contentEl.createEl("button", {
			text: "Cancel",
		});
		cancelBtn.onclick = () => {
			this.close();
			onSubmit(false);
		};

		const confirmBtn = this.contentEl.createEl("button", {
			text: "Confirm",
		});
		confirmBtn.onclick = () => {
			this.close();
			onSubmit(true);
		};
	}
}
