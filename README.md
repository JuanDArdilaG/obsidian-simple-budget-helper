# Obsidian Simple Budget Helper

A simple budget helper for [Obsidian](https://obsidian.md)

## Split Payment System

This plugin supports split payments across multiple accounts through a flexible "from" and "to" splits system that handles various transaction types.

### Understanding Splits

The split system consists of two main components:

-   **From Splits (`fromSplits`)**: Used for both income and expense operations to specify where money comes from or goes to
-   **To Splits (`toSplits`)**: Used exclusively for transfer operations to specify the destination account

### Transaction Types and Split Usage

#### 1. Income Transactions

-   **From Splits**: Specify the source accounts where the income comes from (e.g., salary account, investment returns)
-   **To Splits**: Not used (empty array)
-   **Example**: Receiving salary into your main account
    ```typescript
    {
      operation: "income",
      fromSplits: [{ accountId: "salary-account", amount: 5000 }],
      toSplits: []
    }
    ```

#### 2. Expense Transactions

-   **From Splits**: Specify the accounts where money is spent from (e.g., checking account, credit card)
-   **To Splits**: Not used (empty array)
-   **Example**: Paying rent from your checking account
    ```typescript
    {
      operation: "expense",
      fromSplits: [{ accountId: "checking-account", amount: 1200 }],
      toSplits: []
    }
    ```

#### 3. Transfer Transactions

-   **From Splits**: Specify the source account(s) where money is transferred from
-   **To Splits**: Specify the destination account(s) where money is transferred to
-   **Example**: Moving money from checking to savings
    ```typescript
    {
      operation: "transfer",
      fromSplits: [{ accountId: "checking-account", amount: 1000 }],
      toSplits: [{ accountId: "savings-account", amount: 1000 }]
    }
    ```

### Multi-Account Splits

Both from and to splits support multiple accounts for complex scenarios:

#### Split Payment Example

Paying a $2000 expense using multiple accounts:

```typescript
{
  operation: "expense",
  fromSplits: [
    { accountId: "checking-account", amount: 1200 },
    { accountId: "credit-card", amount: 800 }
  ],
  toSplits: []
}
```

#### Multi-Destination Transfer Example

Transferring money to multiple accounts:

```typescript
{
  operation: "transfer",
  fromSplits: [{ accountId: "main-account", amount: 1500 }],
  toSplits: [
    { accountId: "savings-account", amount: 1000 },
    { accountId: "investment-account", amount: 500 }
  ]
}
```

### Account Type Considerations

The system automatically handles different account types (Asset, Liability) when calculating balances:

-   **Asset to Asset transfers**: Neutral (no impact on total balance)
-   **Asset to Liability transfers**: Treated as expense (reduces net worth)
-   **Liability to Asset transfers**: Treated as income (increases net worth)
-   **Income/Expense operations**: Always impact balance based on operation type

### Benefits of the Split System

1. **Flexibility**: Support for complex payment scenarios
2. **Accuracy**: Precise tracking of money flow between accounts
3. **Scalability**: Easy to add new accounts without changing core logic
4. **Consistency**: Unified approach for all transaction types
5. **Reporting**: Detailed breakdowns of account-specific transactions

## Transactions

### Record a Transaction

The transaction recording system provides a comprehensive interface for creating and managing financial transactions.

#### Calculator Functionality

Each amount field in the transaction form includes a built-in calculator that allows you to perform mathematical operations directly within the interface.

**Features:**

-   **Mathematical Operations**: Support for addition (+), subtraction (-), multiplication (\*), and division (/)
-   **Parentheses Grouping**: Use parentheses to group operations and control calculation order
-   **Mobile-Friendly**: Responsive design that works on all device sizes
-   **Keyboard Support**: Press Enter to quickly calculate results

**Usage Examples:**

-   `10 + 5` → Calculates 15
-   `20 * 0.15` → Calculates 3 (15% of 20)
-   `(100 - 10) / 2` → Calculates 45 (subtract 10 from 100, then divide by 2)
-   `50 + 25 * 2` → Calculates 100 (multiplication before addition)

**How to Use:**

1. Click the calculator icon (🧮) next to any amount field
2. Enter your mathematical expression in the modal
3. Press Enter or click "Calculate" to apply the result
4. The calculated amount will automatically update the field

**Error Handling:**

-   Invalid mathematical expressions show clear error messages
-   Negative amounts are prevented (transactions cannot have negative values, you should create an expense transaction instead)
-   Syntax errors are caught and displayed to the user

This calculator feature streamlines the transaction recording process, especially useful for:

-   Calculating taxes and fees
-   Computing discounts and percentages
-   Splitting bills and expenses
-   Converting currencies or units
-   Complex financial calculations
