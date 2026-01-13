# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   EUR and GDP currency symbols.

## [0.17.0] - 2026-01-13

### Added

-   Add decimals to the amount field in the transaction form.
-   Add currency field to accounts.
-   Add savings calculation for next month's expenses in scheduled transactions list.
-   Option to change account name in accounts list.

### Changed

-   Create successive transactions doesn't preserve the date in the transaction form anymore.

### Fixed

-   Transactions form was reset when creating a new category or subcategory from the form.
-   Fix bug that avoids deleting a category.
-   Fix backup listing to not consider macOS metadata files (.\_\*.json) as valid backups.
-   Next occurrence calculation for scheduled transactions list was not considering modifications properly, leading to incorrect next occurrence dates.

## [0.14.2] - 2025-09-21

### Fixed

-   Transactions in accounting list is showing zero amount for the incoming account.
-   Form is not loading any info when trying to edit a transaction that comes from a scheduled item.

## [0.14.1] - 2025-09-21

### Fixed

-   Fixed account details formatting in integrity report modal: account ID replaced with account name for better clarity, and price values are now displayed using the PriceValueObject format (from 10 to $10.00).

## [0.14.0] - 2025-09-21

### Added

-   Introduced a new feature for automatic account balance adjustments using integrity checks: [Link to Feature Documentation](./docs/ACCOUNTS_INTEGRITY_CALCULATION.md).

## [0.13.14] - 2025-08-18

### Fixed

#### Accounting

-   Increase accounting item height to accomodate multiaccount transactions.
-   Load brand name in transaction form when creating a new transaction.

## [0.13.13] - 2025-08-18

### Changed

#### Accounting

-   Display multiaccount transactions as one item with the information for every account.

## [0.13.12] - 2025-08-16

### Added

-   Add search input component to accounting list.

### Changed

-   Transfer transactions doesn't require quantity, type, brand, nor store.

## [0.13.11] - 2025-08-14

### Changed

-   Replace atob implementation for a more browser-compatible method.
