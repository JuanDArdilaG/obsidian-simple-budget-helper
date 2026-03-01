# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Transactions:** Now you can create transactions with multiple items, before they were created as separate transactions.
- **Calculator Input:** Amount fields in the different forms now support calculator input, allowing you to type mathematical expressions directly into the amount field when creating or editing. The expression is evaluated in real time, and the result is displayed as a formatted price.
- **Scheduled Calendar**: In the current cash and checking info, now you can see a breakdown of the accounts that are contributing to the total balance, sorted by balance amount.

### Fixed

- **Backup Restoration:** When restoring a backup or migrating data between versions, the local files were not being updated with the restored data, just the indexedDB, causing inconsistencies.

### Security

- **Dependency Updates:**
    - awilix 12.1.1 -> 13.0.1
    - framer-motion 12.34.0 -> 12.34.3
    - lucide-react 0.564.0 -> 0.575.0
    - tailwindcss 4.1.18 -> 4.2.1

## [0.22.0] - 2026-02-24

### Added

- **Accounts Dashboard:** Shows the percentage change of assets, liabilities, and net worth compared to the previous month.
- **Physical Assets:** Now you can create physical assets to better reflect your net worth and have a more complete picture of your finances. It also allows you to track the value of your physical assets over time by calculating the depreciation of the asset based on its useful life and acquisition date.

### Changed

- **UI/UX Improvements:** Improved UI/UX for the overall plugin.

## [0.20.0] - 2026-01-21

### Added

- **Subtype to Accounts:** Assets = Cash, Checking, Savings, Investment; Liabilities = Credit Card, Loans.
- **Scheduled Transactions List:** Add an option to record a scheduled transaction directly from the list.
- **Recurrence Pattern Editing:** Now the recurrence pattern could be edited when modifying a scheduled transaction.

### Changed

- **Sort Options on the Select Component:** Sort options on the Select component using localeCompare.
- **Scheduled Transactions Form:** Merge scheduled transactions' single recurrence and general recurrence editions into one form to avoid confusion when editing scheduled transactions.
- **Accounting List Rendering:** Change the way accounting list is rendered to improve performance and styling issues.

### Fixed

- **Transaction Form:** Fix transaction form not updating the transaction type and accounts when selecting a previously used transaction name.

### Security

- **Dependency Updates:** Update dependencies to fix security vulnerabilities.

## [0.19.0] - 2026-01-16

### Added

- **Scheduled Transactions:** Scheduled transaction name, amount, start date, and frequency can now be edited.
- **Scheduled Transactions Summary:** Fix and separate the scheduled transactions summary section to show total expenses, total incomes, net balance, and savings recommendation for upcoming months.

## [0.18.0] - 2026-01-15

### Added

- **EUR and GDP Currency Symbols:** Added support for EUR and GDP currency symbols.
- **Exchange Rate Fetching:** Fetch exchange rates for all supported currencies.
- **Account Balance Display:** Show account balance in default currency in accounts list and account's totals.
- **Transaction Form Exchange Rate:** Add exchange rate field to transaction form when creating transfer transactions between different currencies.

## [0.17.0] - 2026-01-13

### Added

- **Transaction Form Decimals:** Add decimals to the amount field in the transaction form.
- **Account Currency Field:** Add currency field to accounts.
- **Scheduled Transactions Savings Calculation:** Add savings calculation for next month's expenses in scheduled transactions list.
- **Account Name Change:** Option to change account name in accounts list.

### Changed

- **Successive Transactions:** Create successive transactions doesn't preserve the date in the transaction form anymore.

### Fixed

- **Transaction Form Reset:** Transactions form was reset when creating a new category or subcategory from the form.
- **Category Deletion:** Fix bug that avoids deleting a category.
- **Backup Listing:** Fix backup listing to not consider macOS metadata files (.\_\*.json) as valid backups.
- **Scheduled Transactions Next Occurrence:** Next occurrence calculation for scheduled transactions list was not considering modifications properly, leading to incorrect next occurrence dates.
- **Account Currencies on Reload:** Bug when reloading the plugin causes account currencies to be set as COP.

## [0.14.2] - 2025-09-21

### Fixed

- **Accounting List Zero Amount:** Transactions in accounting list is showing zero amount for the incoming account.
- **Transaction Form Loading:** Form is not loading any info when trying to edit a transaction that comes from a scheduled item.

## [0.14.1] - 2025-09-21

### Fixed

- **Account Details Formatting:** Fixed account details formatting in integrity report modal: account ID replaced with account name for better clarity, and price values are now displayed using the PriceValueObject format (from 10 to $10.00).

## [0.14.0] - 2025-09-21

### Added

- **Automatic Account Balance Adjustments:** Introduced a new feature for automatic account balance adjustments using integrity checks: [Link to Feature Documentation](./docs/ACCOUNTS_INTEGRITY_CALCULATION.md).

## [0.13.14] - 2025-08-18

### Fixed

#### Accounting

- **Increase Accounting Item Height:** Increase accounting item height to accomodate multiaccount transactions.
- **Load Brand Name:** Load brand name in transaction form when creating a new transaction.

## [0.13.13] - 2025-08-18

### Changed

#### Accounting

- **Display Multi-Account Transactions:** Display multi-account transactions as one item with the information for every account.

## [0.13.12] - 2025-08-16

### Added

- **Search Input Component:** Add search input component to accounting list.

### Changed

- **Transfer Transactions:** Transfer transactions doesn't require quantity, type, brand, nor store.

## [0.13.11] - 2025-08-14

### Changed

- **atob Implementation:** Replace atob implementation for a more browser-compatible method.
