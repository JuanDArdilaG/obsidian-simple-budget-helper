# Accounts Integrity Calculation

This document outlines the feature to calculate the integrity of accounts within the system. The integrity calculation is designed to ensure that all account data is accurate, consistent, and reliable based on the transactions history.
It provides a mechanism to identify discrepancies and maintain the overall health of the financial data.

## Overview

The integrity of an account is determined by comparing the expected balance, derived from the initial balance and all subsequent transactions, against the actual recorded balance. Any discrepancies between these two values indicate potential issues that need to be addressed.
The integrity calculation process involves the following steps:

1. **Transaction Retrieval**: Retrieve all transactions associated with the account.
2. **Expected Balance Calculation**: Calculate the expected balance by applying all transactions.
3. **Comparison**: Compare the expected balance to the actual recorded balance.
4. **Discrepancy Identification**: Identify and report any discrepancies found during the comparison.
5. **Resolution Tool**: Provide the possibility to resolve discrepancies through an automatic adjustment.

To use the feature, users can find it in the "Account Integrity" section in the plugin settings to trigger the integrity calculation process and get the summary of findings, along with options to resolve any discrepancies.

## Integrity Calculation Steps

### 1. Retrieve Transactions

Fetch all transactions linked to the account from the database. It should consider all types of transactions, including income, expenses, and transfers.

### 2. Calculate Expected Balance

Apply all retrieved transactions to the initial balance to compute the expected balance.
The formula is as follows:
`Expected Balance = Initial Balance + Σ (All Income Transactions) - Σ (All Expense Transactions) + Σ (All Incoming Transfer Transactions) - Σ (All Outgoing Transfer Transactions)`

### 3. Compare Balances

Assess the expected balance against the actual recorded balance for every account.

### 4. Identify Discrepancies

Detect and generate a report for the discrepancies that arise from the comparison. If any discrepancies are found, they should be logged with details such as the account ID, expected balance, actual balance, and the difference. Otherwise, the account is marked as having integrity.

### 5. Resolve Discrepancies

Provide an option to automatically adjust the account balance to match the expected balance.

## Implementation

The integrity calculation feature will be an option in the application settings, allowing users to initiate the process manually. After the calculation, a summary report will be presented to the user, highlighting any discrepancies and offering the option to resolve them.

## Future Enhancements

-   **Scheduled Integrity Checks**: Implement periodic automatic integrity checks.
-   **Notification System**: Notify users of discrepancies via email or in-app notifications.
-   **Detailed Audit Logs**: Maintain a detailed log of all integrity checks and resolutions for auditing purposes.
