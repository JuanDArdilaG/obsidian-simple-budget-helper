import { CalculateAllAccountsIntegrityUseCase } from "contexts/Accounts/application/calculate-all-accounts-integrity.usecase";
import { ResolveAccountDiscrepancyUseCase } from "contexts/Accounts/application/resolve-account-discrepancy.usecase";
import { App, Modal, Notice, PluginSettingTab, Setting } from "obsidian";
import { GetAllAccountsUseCase } from "../../contexts/Accounts/application/get-all-accounts.usecase";
import { Account, IntegrityCheckReport } from "../../contexts/Accounts/domain";
import { currencies } from "../../contexts/Currencies/domain/currency.vo";
import { TransactionAmount } from "../../contexts/Transactions/domain";
import SimpleBudgetHelperPlugin from "./main";

class IntegrityReportModal extends Modal {
	report: IntegrityCheckReport;
	plugin: SimpleBudgetHelperPlugin;
	allAccounts: Account[];

	constructor(
		app: App,
		plugin: SimpleBudgetHelperPlugin,
		report: IntegrityCheckReport,
		allAccounts: Account[]
	) {
		super(app);
		this.report = report;
		this.plugin = plugin;
		this.allAccounts = allAccounts;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const reportPrimitives = this.report.toPrimitives();

		contentEl.createEl("h2", { text: "Account Integrity Report" });

		// Create a summary section
		const summaryEl = contentEl.createEl("div", {
			cls: "integrity-summary",
		});
		summaryEl.createEl("p", {
			text: `Total accounts checked: ${reportPrimitives.totalAccountsChecked}`,
		});
		summaryEl.createEl("p", {
			text: `Accounts with discrepancies: ${reportPrimitives.totalDiscrepancies}`,
		});
		summaryEl.createEl("p", {
			text: `Execution date: ${new Date(
				reportPrimitives.executionDate
			).toLocaleString()}`,
		});

		if (reportPrimitives.hasDiscrepancies) {
			const discrepanciesEl = contentEl.createEl("div");
			discrepanciesEl.createEl("h4", {
				text: "Accounts with Discrepancies",
				cls: "integrity-error",
			});

			reportPrimitives.results
				.filter((result) => !result.hasIntegrity)
				.forEach((result) => {
					const accountEl = discrepanciesEl.createEl("div", {
						cls: "integrity-account-item",
					});
					accountEl.createEl("p", {
						text: `Account: ${
							this.allAccounts.find(
								(account) =>
									account.id.value === result.accountId
							)?.name || result.accountId
						}`,
					});
					accountEl.createEl("p", {
						text: `Expected Balance: ${new TransactionAmount(
							result.expectedBalance
						)}`,
					});
					accountEl.createEl("p", {
						text: `Actual Balance: ${new TransactionAmount(
							result.actualBalance
						)}`,
					});
					accountEl.createEl("p", {
						text: `Discrepancy: ${new TransactionAmount(
							result.discrepancy
						)}`,
						cls: "integrity-discrepancy",
					});

					const resolveButton = accountEl.createEl("button", {
						text: "Resolve Discrepancy",
					});
					resolveButton.onclick = async () => {
						resolveButton.disabled = true;
						resolveButton.textContent = "Resolving...";

						try {
							const resolveUseCase =
								this.plugin.container.resolve<ResolveAccountDiscrepancyUseCase>(
									"resolveAccountDiscrepancyUseCase"
								);
							await resolveUseCase.execute(result.accountId);

							accountEl.style.backgroundColor =
								"var(--background-modifier-success)";
							resolveButton.textContent = "Resolved ✓";
							resolveButton.disabled = true;
							new Notice("Discrepancy resolved successfully!");
						} catch (error) {
							console.error(
								"Failed to resolve discrepancy:",
								error
							);
							resolveButton.textContent = "Failed to resolve";
							resolveButton.style.backgroundColor =
								"var(--background-modifier-error)";
							new Notice(
								"Failed to resolve discrepancy: " +
									(error instanceof Error
										? error.message
										: String(error))
							);
						}
					};
				});
		} else {
			contentEl.createEl("p", {
				text: "✅ All accounts have integrity! No discrepancies found.",
				cls: "integrity-success",
			});
		}

		// Add some basic styling
		const styleEl = document.createElement("style");
		styleEl.textContent = `
			.integrity-summary {
				background: var(--background-secondary);
				padding: 12px;
				border-radius: 4px;
				margin-bottom: 16px;
			}
			.integrity-account-item {
				padding: 12px;
				margin: 8px 0;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--background-secondary);
			}
			.integrity-error {
				color: var(--text-error);
			}
			.integrity-success {
				color: var(--text-success);
				text-align: center;
				padding: 16px;
			}
			.integrity-discrepancy {
				color: var(--text-error);
				font-weight: bold;
			}
		`;
		contentEl.appendChild(styleEl);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class SettingTab extends PluginSettingTab {
	plugin: SimpleBudgetHelperPlugin;

	constructor(app: App, plugin: SimpleBudgetHelperPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Default Currency")
			.setDesc("The preferred currency for accounts and transactions")
			.addDropdown((dropdown) =>
				dropdown
					.setValue(this.plugin.settings.defaultCurrency)
					.addOptions(
						Object.keys(currencies).reduce((options, code) => {
							options[
								code
							] = `${code} - ${currencies[code].name}`;
							return options;
						}, {} as Record<string, string>)
					)
					.onChange(async (value) => {
						this.plugin.settings.defaultCurrency = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Root folder")
			.setDesc("The path to the root folder to store budget items")
			.addText((text) =>
				text
					.setPlaceholder("Root Folder Path")
					.setValue(this.plugin.settings.rootFolder)
					.onChange(async (value) => {
						this.plugin.settings.rootFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Debug mode")
			.setDesc("Enable/Disable debug mode")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.debugMode)
					.onChange(async (value) => {
						this.plugin.settings.debugMode = value;
						await this.plugin.saveSettings();
					})
			);

		// Accounts Integrity Section
		containerEl.createEl("h3", { text: "Account Integrity" });

		new Setting(containerEl)
			.setName("Run Account Integrity Check")
			.setDesc(
				"Check all accounts for balance discrepancies based on transaction history"
			)
			.addButton((button) =>
				button.setButtonText("Run Check").onClick(async () => {
					button.setDisabled(true);
					button.setButtonText("Running...");

					try {
						const integrityUseCase =
							this.plugin.container.resolve<CalculateAllAccountsIntegrityUseCase>(
								"calculateAllAccountsIntegrityUseCase"
							);
						const getAllAccountsUseCase =
							this.plugin.container.resolve<GetAllAccountsUseCase>(
								"getAllAccountsUseCase"
							);
						const report = await integrityUseCase.execute();
						const allAccounts =
							await getAllAccountsUseCase.execute();

						// Show results in a modal
						const modal = new IntegrityReportModal(
							this.app,
							this.plugin,
							report,
							allAccounts
						);
						modal.open();
					} catch (error) {
						console.error("Failed to run integrity check:", error);
						new Notice(
							"Integrity check failed: " +
								(error instanceof Error
									? error.message
									: String(error))
						);
					} finally {
						button.setDisabled(false);
						button.setButtonText("Run Check");
					}
				})
			);
	}
}
