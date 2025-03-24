import { TFile, Vault } from "obsidian";
import {
	Transaction,
	TransactionAmount,
	TransactionDate,
	TransactionID,
	TransactionName,
	TransactionOperation,
} from "contexts/Transactions";
import { CreateAccountUseCase } from "../../../Accounts/application/create-account.usecase";
import {
	Account,
	AccountName,
	AccountType,
	AccountTypeType,
	GetAllAccountsUseCase,
} from "contexts/Accounts";
import { OperationType } from "contexts/Shared/domain";
import { GetAllCategoriesUseCase } from "contexts/Categories/application/get-all-categories.usecase";
import {
	CreateSubCategoryUseCase,
	GetAllSubcategoriesUseCase,
	Subcategory,
	SubcategoryName,
} from "contexts/Subcategories";
import { CreateCategoryUseCase } from "contexts/Categories/application";
import { Category, CategoryName } from "contexts/Categories";
import { ItemBrand, ItemStore } from "contexts/Items";
import { Logger } from "../logger";
import { RecordTransactionUseCase } from "../../../Transactions/application/record-transaction.usecase";
import { CategoryID } from "../../../Categories/domain/category-id.valueobject";

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
		readonly recordTransactionUseCase: RecordTransactionUseCase
	) {
		this.logger = new Logger("MDMigration");
	}

	migrate = async (): Promise<Transaction[]> => {
		const transactions = [];

		const file = this.vault.getFileByPath(`${this.rootFolder}/Simple.md`);
		if (file) {
			const fileContent = await this.vault.cachedRead(file);
			transactions.push(...(await this.#simpleTransactions(fileContent)));
		}

		return transactions;
	};

	#simpleTransactions = async (markdown: string): Promise<Transaction[]> => {
		const lines = markdown
			.split("\n")
			.filter((line) => !!line)
			.slice(2)
			.reverse();
		this.logger.debug("#fromSimpleTransactionsTableMarkdown", {
			markdown,
			lines,
		});
		const transactions = [];
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

			const account = this.#getOrCreateAccount(accountType, accountName);
			const toAccount = this.#getOrCreateToAccount(
				toAccountType,
				toAccountName
			);
			const category = this.#getOrCreateCategory(cat);
			const subCategory = this.#getOrCreateSubCategory(category.id, sub);

			this.logger.debug("after get and create", {
				account,
				toAccount,
				category,
				subCategory,
			});

			transactions.push(
				new Transaction(
					new TransactionID(id),
					account.id,
					new TransactionName(name),
					new TransactionOperation(type as OperationType),
					category.id,
					subCategory.id,
					new TransactionDate(new Date(date)),
					TransactionAmount.fromString(amount),
					undefined,
					toAccount?.id,
					brand ? new ItemBrand(brand) : undefined,
					store ? new ItemStore(store) : undefined
				)
			);
		}

		transactions.forEach(async (transaction) => {
			await this.recordTransactionUseCase.execute(transaction);
		});

		return transactions;
	};

	#recurrentTransactions = async (
		fileReader: (file: TFile) => Promise<string>
	): Promise<Transaction[]> => {
		const transactions: Transaction[] = [];
		const folder = this.vault.getFolderByPath(
			`${this.rootFolder}/Recurrent`
		);
		if (!folder) throw new Error("recurrent folder not found");
		for (const file of folder.children) {
			if (file instanceof TFile) {
				const fileContent = await fileReader(file);
				const transactions =
					this.#recurrentFromRawMarkdown(fileContent);
				transactions.push(...transactions);
			}
		}

		return transactions;
	};

	#recurrentFromRawMarkdown = (rawMarkdown: string): Transaction[] => {
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

		const historyStr = rawMarkdown.split("# History\n");
		let history = undefined;
		if (historyStr[1]) history = historyStr[1].split("\n");

		const account = this.#getOrCreateAccount("asset", acc);
		const toAccount = this.#getOrCreateToAccount("asset", toAcc);
		const category = this.#getOrCreateCategory(cat);
		const subCategory = this.#getOrCreateSubCategory(category.id, sub);

		if (history) {
			return history
				.filter((r) => !!r)
				.map((r) => {
					return new Transaction(
						new TransactionID(id),
                        account.id,
                        new TransactionName(name)
						r,
						type as "income" | "expense",
						toAccount
					);
				});
		}

		return new Transaction(
			id,
			name,
			account,
			parseInt(amount),
			category,
			subCategory,
			brand,
			store,
			type as "expense" | "income",
			new BudgetItemNextDate(new Date(nextDate), true),
			path,
			new FrequencyString(frequency)
		);
	};

	#getOrCreateAccount(accountType: string, accountName: string) {
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

	#getOrCreateToAccount(toAccountType: string, toAccountName: string) {
		const accounts = await this.getAllAccountsUseCase.execute();
		let toAccount: Account | undefined;
		if (toAccountName) {
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

	#getOrCreateCategory(categoryName: string) {
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

	#getOrCreateSubCategory(categoryID: CategoryID, subCategoryName: string) {
		const subCategories = await this.getAllSubCategoriesUseCase.execute();
		let subCategory = subCategories.find((subCategory) =>
			subCategory.name.equalTo(new SubcategoryName(subCategoryName))
		);
		if (!subCategory) {
			subCategory = Subcategory.create(
				categoryID,
				new SubcategoryName(subCategoryName)
			);
			await this.createSubCategoryUseCase.execute(subCategory);
		}
		return subCategory;
	}
}
