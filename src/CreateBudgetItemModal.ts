import { App, Modal, Setting } from "obsidian";
import { BudgetItem } from "./BudgetItem";
import { FrequencyString } from "./FrequencyString";
import { PriceValueObject } from "@juandardilag/value-objects/dist/PriceValueObject";
import { BudgetItemNextDate } from "./BudgetItemNextDate";

export class CreateBudgetItemModal extends Modal {
	constructor(
		app: App,
		categories: string[],
		onSubmit: (item: BudgetItem) => Promise<void>
	) {
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

		const amountEl = contentEl.createEl("div");
		amountEl.createEl("label", { text: "Amount" });
		const amountInput = amountEl.createEl("input");
		PriceValueObject.parseInput(amountInput, (a) => {
			amount = PriceValueObject.fromString(a).toNumber();
		});

		new Setting(this.contentEl)
			.setName("Frequency")
			.setTooltip("Frequency in the format AyBmoCwDdEhFmGs")
			.addText((text) =>
				text.onChange((value) => {
					frequency = value;
				})
			);

		const categoryEl = contentEl.createEl("div");
		categoryEl.createEl("label", { text: "Category" });
		const categoryInput = categoryEl.createEl("select");
		for (const category of categories) {
			const option = categoryInput.createEl("option");
			option.text = category;
			option.value = category;
		}

		const newCatInput = categoryEl.createEl("input");
		newCatInput.id = "newCatInput";
		newCatInput.oninput = (e: Event) => {
			const value = (e.target as HTMLInputElement).value;
			category = value;
		};

		categoryInput.onchange = (e: Event) => {
			const value = (e.target as HTMLSelectElement).value;
			category = value;

			if (category === "-- create new --") {
				category = "";
				const newCatInput = categoryEl.createEl("input");
				newCatInput.id = "newCatInput";
				newCatInput.oninput = (e: Event) => {
					const value = (e.target as HTMLInputElement).value;
					category = value;
				};
			} else {
				const newCatInput = categoryEl.querySelector("#newCatInput");
				if (newCatInput) {
					newCatInput.remove();
				}
			}
		};

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
							new BudgetItemNextDate(nextDate),
							new FrequencyString(frequency)
						)
					);
				})
		);
	}
}
