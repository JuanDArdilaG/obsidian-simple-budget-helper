import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { views } from "config";

export class ListBudgetItemView extends ItemView {
	private _rootFolder: string;
	constructor(leaf: WorkspaceLeaf, rootFolder: string) {
		super(leaf);
		this._rootFolder = rootFolder;
	}

	getViewType() {
		return views.LIST_BUDGET_ITEMS.type;
	}

	getDisplayText() {
		return views.LIST_BUDGET_ITEMS.title;
	}

	getIcon(): string {
		return views.LIST_BUDGET_ITEMS.icon;
	}

	async onOpen() {
		const listBtn = this.containerEl.createEl("button", {
			text: "Items",
		});
		listBtn.onclick = () => {
			this.listItemsPage();
		};

		const perCategoryBtn = this.containerEl.createEl("button", {
			text: "Per Category",
		});
		perCategoryBtn.onclick = () => {
			this.perCategoryPage();
		};

		const calendar = this.containerEl.createEl("button", {
			text: "Calendar",
		});
		calendar.onclick = () => {
			this.calendar();
		};

		await this.calendar();
	}

	private async _getBudgetItems(config?: { until: Date }): Promise<Budget> {
		const { vault } = this.app;
		const folder = vault.getFolderByPath(`${this._rootFolder}/Recurrent`);
		if (!folder) return new Budget([]);
		const budget = new Budget([]);
		for (const file of folder.children) {
			if (file instanceof TFile) {
				const fileContent = await vault.cachedRead(file);
				const budgetItem = BudgetItem.fromRawMarkdown(
					file.path,
					fileContent
				);
				if (config?.until) {
					const d1 = new Date(budgetItem.nextDate);
					d1.setHours(0, 0, 0, 0);
					const d2 = new Date(config.until);
					d2.setHours(0, 0, 0, 0);
					if (d1.getTime() > d2.getTime()) {
						continue;
					}
				}
				budget.addItems(budgetItem);
			}
		}

		return budget;
	}

	private _listBudget(budget: Budget, calendarView = false) {
		const container = this.containerEl.children[1];
		const total = !calendarView
			? budget.getTotalPerMonth()
			: budget.getTotal();
		if (calendarView) budget = budget.orderByNextDate();
		for (const item of budget.items) {
			const listEl = container.createEl("ul");
			const perMonth = item.perMonthAmount;
			const liEl = listEl.createEl("li");
			const rd = item.remainingDays;
			liEl.style.width = "100%";
			liEl.innerHTML = `<span>${item.name}<br/> ${
				calendarView ? `${new Date(item.nextDate).toDateString()}` : ""
			}</span><br/>
			${
				!calendarView
					? `<b>Category:</b> ${item.category}.<br/>
			<b>Per month:</b> ${PriceValueObject.fromString(
				perMonth.toString()
			).toString()} (${((perMonth / total) * 100).toFixed(2)}%)`
					: `	<span style="text-align: right">${PriceValueObject.fromString(
							item.amount.toString()
					  )}<span><br/><span style="color: ${
							rd.color
					  }; font-size:0.9em; margin-left: 8px">${rd.str}</span>`
			}`;
		}

		container.createEl("h5", {
			text: `Total: ${PriceValueObject.fromString(
				total.toString()
			).toString()}`,
		});
	}

	async listItemsPage() {
		const container = this.containerEl.children[1];

		container.empty();
		container.createEl("h3", { text: "Budget Items" });

		const budget = await this._getBudgetItems();

		this._listBudget(budget);
	}

	async perCategoryPage() {
		const { vault } = this.app;
		const container = this.containerEl.children[1];

		container.empty();
		container.createEl("h3", { text: "Per Category Budget Items" });

		const folder = vault.getFolderByPath(`${this._rootFolder}/Recurrent`);
		if (!folder) return;
		const budget = new Budget([]);
		const perCategory: Record<string, Budget> = {};
		for (const file of folder.children) {
			if (file instanceof TFile) {
				const fileContent = await vault.cachedRead(file);
				const budgetItem = BudgetItem.fromRawMarkdown(
					file.path,
					fileContent
				);
				if (!perCategory[budgetItem.category]) {
					perCategory[budgetItem.category] = new Budget([]);
				}
				perCategory[budgetItem.category].addItems(budgetItem);
				budget.addItems(budgetItem);
			}
		}

		const total = budget.getTotalPerMonth();
		for (const category in perCategory) {
			const perCategoryBudget = perCategory[category];
			const perCategoryTotal = perCategoryBudget.getTotalPerMonth();
			container.createEl("h4", {
				text: `${category} (${(
					(perCategoryTotal / total) *
					100
				).toFixed(2)}%)`,
			});
			const listEl = container.createEl("ul");
			for (const item of perCategoryBudget.items) {
				const liEl = listEl.createEl("li");
				liEl.innerHTML = `${
					item.name
				}.<br/><b>Per month:</b> ${PriceValueObject.fromString(
					item.perMonthAmount.toString()
				).toString()} (${(
					(item.perMonthAmount / perCategoryTotal) *
					100
				).toFixed(2)}%)`;
			}
			container.createEl("h5", {
				text: `Total: ${PriceValueObject.fromString(
					perCategoryTotal.toString()
				).toString()}`,
			});
		}

		container.createEl("h4", {
			text: `Total: ${PriceValueObject.fromString(
				total.toString()
			).toString()}`,
		});
	}

	async calendar(timeframe: "month" | "2weeks" | "week" | "3days" = "3days") {
		const container = this.containerEl.children[1];

		container.empty();

		const timeframeButtonBuilder = (
			text: string,
			tf: "month" | "2weeks" | "week" | "3days"
		) => {
			const timeframeBtn = container.createEl("button", { text });
			timeframeBtn.onclick = async () => {
				await this.calendar(tf);
			};
			if (timeframe === tf) timeframeBtn.disabled = true;
		};

		timeframeButtonBuilder("3d", "3days");
		timeframeButtonBuilder("1w", "week");
		timeframeButtonBuilder("2w", "2weeks");
		timeframeButtonBuilder("1mo", "month");

		container.createEl("h3", {
			text: `Upcoming Next ${
				timeframe === "month"
					? "Month"
					: timeframe === "2weeks"
					? "2 Weeks"
					: timeframe === "week"
					? "Week"
					: "3 Days"
			}`,
		});

		const days =
			timeframe === "month"
				? 30
				: timeframe === "2weeks"
				? 14
				: timeframe === "week"
				? 7
				: 3;
		const until = new Date(
			new Date().getTime() + days * 24 * 60 * 60 * 1000
		);

		const budget = await this._getBudgetItems({ until });

		this._listBudget(budget, true);
	}

	async onClose() {
		// Nothing to clean up.
	}
}
