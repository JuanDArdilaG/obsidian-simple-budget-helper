import { TFile, Vault } from "obsidian";
import {
	RecordSimpleItemUseCase,
	Transaction,
	TransactionAmount,
	TransactionDate,
	TransactionID,
	TransactionName,
	RecordTransactionUseCase,
} from "contexts/Transactions";
import {
	Account,
	AccountName,
	AccountType,
	AccountTypeType,
	GetAllAccountsUseCase,
	CreateAccountUseCase,
} from "contexts/Accounts";
import { OperationType, Logger } from "contexts/Shared";
import {
	CreateSubCategoryUseCase,
	GetAllSubcategoriesUseCase,
	SubCategory,
	SubCategoryName,
} from "contexts/Subcategories";
import {
	Category,
	CategoryID,
	CategoryName,
	GetAllCategoriesUseCase,
	CreateCategoryUseCase,
} from "contexts/Categories";
import {
	CreateRecurrentItemUseCase,
	Item,
	ItemBrand,
	ItemID,
	ItemName,
	ItemOperation,
	ItemPrice,
	ItemStore,
	RecurrentItem,
	RecurrentItemNextDate,
	RecurrrentItemFrequency,
	SimpleItem,
} from "contexts/Items";

export class MDMigration {
	readonly logger: Logger;
	constructor(
		readonly vault: Vault,
		readonly rootFolder: string,
		readonly getAllAccountsUseCase: GetAllAccountsUseCase,
		readonly getAllCategoriesUseCase: GetAllCategoriesUseCase,
		readonly getAllSubCategoriesUseCase: GetAllSubcategoriesUseCase,
		readonly createAccountUseCase: CreateAccountUseCase,
		readonly createCategoryUseCase: CreateCategoryUseCase,
		readonly createSubCategoryUseCase: CreateSubCategoryUseCase,
		readonly recordTransactionUseCase: RecordTransactionUseCase,
		readonly recordSimpleItemUseCase: RecordSimpleItemUseCase,
		readonly createRecurrentItemUseCase: CreateRecurrentItemUseCase
	) {
		this.logger = new Logger("MDMigration");
	}

	migrate = async (): Promise<{
		items: Item[];
		transactions: Transaction[];
	}> => {
		const file = this.vault.getFileByPath(`${this.rootFolder}/Simple.md`);
		if (!file) throw new Error("opening simple transactions file");

		const fileContent = await this.vault.cachedRead(file);
		const simpleItems = await this.#simpleItems(fileContent);
		for (let { item, date } of simpleItems) {
			await this.recordSimpleItemUseCase.execute({ item, date });
		}

		const recurrentItems = await this.#recurrentTransactions(
			this.vault.cachedRead
		);
		for (let { item, transactions } of recurrentItems) {
			for (let transaction of transactions) {
				await this.recordTransactionUseCase.execute(transaction);
			}
			await this.createRecurrentItemUseCase.execute(item);
		}

		return {
			items: [
				...simpleItems.map((i) => i.item),
				...recurrentItems.map((i) => i.item),
			],
			transactions: recurrentItems.map((i) => i.transactions).flat(),
		};
	};

	#simpleItems = async (
		markdown: string
	): Promise<{ item: SimpleItem; date: TransactionDate }[]> => {
		const lines = markdown
			.split("\n")
			.filter((line) => !!line)
			.slice(2)
			.reverse();
		this.logger.debug("#fromSimpleTransactionsTableMarkdown", {
			markdown,
			lines,
		});
		const items = [];
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].split("|").map((item) => item.trim());
			this.logger.debug("line", {
				line,
			});
			const [
				,
				id,
				name,
				type,
				cat,
				sub,
				brand,
				store,
				acc,
				accType,
				date,
				amount,
			] = line;

			let accountName = acc;
			let toAccountName = "";
			let accountType = accType;
			let toAccountType = "";
			if (type === "transfer") {
				[accountName, toAccountName] = acc.split(" - ");
				[accountType, toAccountType] = accType.split(" - ");
			}

			const account = await this.#getOrCreateAccount(
				accountType,
				accountName
			);
			const toAccount = await this.#getOrCreateToAccount(
				toAccountType,
				toAccountName
			);
			const category = await this.#getOrCreateCategory(cat);
			const subCategory = await this.#getOrCreateSubCategory(
				category.id,
				sub
			);

			this.logger.debug("after get and create", {
				account,
				toAccount,
				category,
				subCategory,
			});

			const item = new SimpleItem(
				ItemID.generate(),
				new ItemOperation(type as OperationType),
				new ItemName(name),
				ItemPrice.fromString(amount),
				category.id,
				subCategory.id,
				account.id,
				brand ? new ItemBrand(brand) : undefined,
				store ? new ItemStore(store) : undefined,
				toAccount?.id
			);

			items.push({ item, date: new TransactionDate(new Date(date)) });
		}

		return items;
	};

	#recurrentTransactions = async (
		fileReader: (file: TFile) => Promise<string>
	): Promise<{ item: RecurrentItem; transactions: Transaction[] }[]> => {
		const folder = this.vault.getFolderByPath(
			`${this.rootFolder}/Recurrent`
		);
		if (!folder) throw new Error("recurrent folder not found");
		const items = [];
		for (const file of folder.children) {
			if (file instanceof TFile) {
				const fileContent = await fileReader(file);
				const item = await this.#recurrentFromRawMarkdown(fileContent);
				this.logger.debug("recurrent file", {
					fileContent,
					item,
				});
				items.push(item);
			}
		}

		this.logger.debug("recurrent files transactions", {
			transactions: items,
		});

		return items;
	};

	#recurrentFromRawMarkdown = async (
		rawMarkdown: string
	): Promise<{ item: RecurrentItem; transactions: Transaction[] }> => {
		const propertiesRegex =
			/id: (.*)\nname: (.*)\namount: (.*)\ncategory: (.*)\nsubCategory:(.*)\nbrand:(.*)\nstore:(.*)\ntype: (.*)\nnextDate: (.*)\nfrequency: (.*)\naccount: (.*)(?:\nto account: (.*))?/;
		const match = propertiesRegex.exec(rawMarkdown);
		if (!match) throw new Error("Invalid raw markdown.");
		const [
			,
			id,
			name,
			amount,
			cat,
			sub,
			brand,
			store,
			type,
			nextDate,
			frequency,
			acc,
			toAcc,
		] = match;

		const account = await this.#getOrCreateAccount("asset", acc);
		const toAccount = await this.#getOrCreateToAccount(
			"asset",
			toAcc?.trim()
		);
		const category = await this.#getOrCreateCategory(cat.trim());
		const subCategory = await this.#getOrCreateSubCategory(
			category.id,
			sub.trim() || "To Assign"
		);

		const item = new RecurrentItem(
			new ItemID(id),
			new ItemOperation(type.trim() as OperationType),
			new ItemName(name),
			ItemPrice.fromString(amount),
			category.id,
			subCategory.id,
			account.id,
			new RecurrentItemNextDate(new Date(nextDate)),
			new RecurrrentItemFrequency(frequency),
			undefined,
			brand?.trim() ? new ItemBrand(brand.trim()) : undefined,
			store?.trim() ? new ItemStore(store.trim()) : undefined
		);

		const historyStr = rawMarkdown.split("# History\n");
		let history = undefined;
		if (historyStr[1]) history = historyStr[1].split("\n");
		let transactions: Transaction[] = [];

		if (history) {
			transactions = await Promise.all(
				history
					.filter((r) => !!r)
					.map(async (r) => {
						const match =
							/id: (.*)\. name: (.*)\. account: (.*)\. date: (.*)\. amount: (.*)(?:\. brand: (.*)\.(?: store: (.*)))?/.exec(
								r
							);
						if (!match) throw new Error("Invalid raw markdown.");
						const [, id, name, acc, date, amount, brand, store] =
							match;
						const account = await this.#getOrCreateAccount(
							"asset",
							acc
						);

						return new Transaction(
							id.length === 21
								? new TransactionID(id.trim())
								: TransactionID.generate(),
							account.id,
							new TransactionName(name.trim()),
							item.operation,
							category.id,
							subCategory.id,
							new TransactionDate(new Date(date.trim())),
							TransactionAmount.fromString(amount.trim()),
							item.id,
							toAccount?.id,
							brand?.trim()
								? new ItemBrand(brand.trim())
								: undefined,
							store?.trim()
								? new ItemStore(store.trim())
								: undefined
						);
					})
			);
		}

		return { transactions, item };
	};

	async #getOrCreateAccount(accountType: string, accountName: string) {
		const accounts = await this.getAllAccountsUseCase.execute();
		let account = accounts.find((acc) =>
			acc.name.equalTo(new AccountName(accountName))
		);
		if (!account) {
			account = Account.create(
				new AccountType(accountType as AccountTypeType),
				new AccountName(accountName)
			);
			await this.createAccountUseCase.execute(account);
		}
		return account;
	}

	async #getOrCreateToAccount(toAccountType: string, toAccountName?: string) {
		let toAccount: Account | undefined;
		if (toAccountName) {
			const accounts = await this.getAllAccountsUseCase.execute();
			toAccount = accounts.find((acc) =>
				acc.name.equalTo(new AccountName(toAccountName))
			);
			if (!toAccount) {
				toAccount = Account.create(
					new AccountType(toAccountType as AccountTypeType),
					new AccountName(toAccountName)
				);
				await this.createAccountUseCase.execute(toAccount);
			}
		}
		return toAccount;
	}

	async #getOrCreateCategory(categoryName: string) {
		const categories = await this.getAllCategoriesUseCase.execute();
		let category = categories.find((category) =>
			category.name.equalTo(new CategoryName(categoryName))
		);
		if (!category) {
			category = Category.create(new CategoryName(categoryName));
			await this.createCategoryUseCase.execute(category);
		}
		return category;
	}

	async #getOrCreateSubCategory(
		categoryID: CategoryID,
		subCategoryName: string
	) {
		const subCategories = await this.getAllSubCategoriesUseCase.execute();
		let subCategory = subCategories.find((subCategory) =>
			subCategory.name.equalTo(new SubCategoryName(subCategoryName))
		);
		if (!subCategory) {
			subCategory = SubCategory.create(
				categoryID,
				new SubCategoryName(subCategoryName)
			);
			await this.createSubCategoryUseCase.execute(subCategory);
		}
		return subCategory;
	}
}
