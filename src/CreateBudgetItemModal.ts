import { App, Modal, Setting } from "obsidian";
import { BudgetItem } from "./BudgetItem";

export class CreateBudgetItemModal extends Modal {
	constructor(app: App, onSubmit: (item: BudgetItem) => Promise<void>) {
		super(app);
		this.setTitle("New Budget Item");

		const { contentEl } = this;

		let name = "";
		let amount = 0;
		let frequency = "";
		let category = "";
		let nextDate = new Date();

		new Setting(this.contentEl).setName("Name").addText((text) =>
			text.onChange((value) => {
				name = value;
			})
		);

		new Setting(this.contentEl).setName("Amount").addText((text) =>
			text.onChange((value) => {
				amount = parseInt(value);
			})
		);

		new Setting(this.contentEl)
			.setName("Frequency")
			.setTooltip("Frequency in the format AyBmoCwDdEhFmGs")
			.addText((text) =>
				text.onChange((value) => {
					frequency = value;
				})
			);

		new Setting(this.contentEl)
			.setName("Category")
			.setTooltip("Category to wich the item belongs")
			.addText((text) =>
				text.onChange((value) => {
					category = value;
				})
			);

		contentEl.createEl("label", { text: "Next Date" });
		const nextDateInput = contentEl.createEl("input", {
			type: "date",
		});
		nextDateInput.onchange = (e: Event) => {
			const value = (e.target as HTMLInputElement).value;
			nextDate = new Date(`${value}T00:00:00`);
		};

		new Setting(this.contentEl).addButton((btn) =>
			btn
				.setButtonText("Submit")
				.setCta()
				.onClick(async () => {
					this.close();
					await onSubmit(
						new BudgetItem(
							name,
							amount,
							category,
							nextDate,
							frequency
						)
					);
				})
		);
	}
}
