import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, SimpleBudgetHelperSettings } from "./SettingTab";
import { buildContainer } from "contexts/Shared/infrastructure/di/container";
import { Logger } from "../../contexts/Shared/infrastructure/logger";
import { LeftMenuItems, SettingTab, views } from "apps/obsidian-plugin";
import { RightSidebarReactViewRoot } from "apps/obsidian-plugin/views";

export default class SimpleBudgetHelperPlugin extends Plugin {
	settings: SimpleBudgetHelperSettings;

	async onload() {
		await initStoragePersistence();
		const storageQuota = await showEstimatedQuota();
		Logger.debug("storage quota", { storageQuota });

		const container = buildContainer();

		await this.loadSettings();

		const statusBarItem = this.addStatusBarItem();
		this.registerView(
			views.LIST_BUDGET_ITEMS_REACT.type,
			(leaf) =>
				new RightSidebarReactViewRoot(
					leaf,
					this,
					(text) => statusBarItem.setText(text),
					container
				)
		);

		this.addSettingTab(new SettingTab(this.app, this));
		LeftMenuItems.RightSidebarPanel(this);
	}

	onunload() {
		persist();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

async function persist() {
	return navigator.storage && navigator.storage.persist
		? navigator.storage.persist()
		: undefined;
}

async function showEstimatedQuota(): Promise<
	{ quota?: number; usage?: number; percentage?: number } | undefined
> {
	const estimation =
		navigator.storage && navigator.storage.estimate
			? await navigator.storage.estimate()
			: undefined;
	if (!estimation) return undefined;
	return {
		...estimation,
		percentage: estimation.quota
			? ((estimation.usage ?? 0) / estimation.quota) * 100
			: 0,
	};
}

async function tryPersistWithoutPromptingUser() {
	if (!navigator.storage || !navigator.storage.persisted) return "never";
	let persisted = await navigator.storage.persisted();
	if (persisted) return "persisted";
	if (!navigator.permissions || !navigator.permissions.query) return "prompt";
	const permission = await navigator.permissions.query({
		name: "persistent-storage",
	});
	if (permission.state === "granted") {
		persisted = await navigator.storage.persist();
		if (persisted) return "persisted";
		throw new Error("failed to persist");
	}
	if (permission.state === "prompt") return "prompt";
	return "never";
}

async function initStoragePersistence() {
	const persist = await tryPersistWithoutPromptingUser();
	console.log({ persist });
}
