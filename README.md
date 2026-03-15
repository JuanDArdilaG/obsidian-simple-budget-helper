# Obsidian Simple Budget Helper

A simple budget helper for [Obsidian](https://obsidian.md)

## Transactions

### Record a Transaction

The transaction recording system provides a comprehensive interface for creating and managing financial transactions.

### Calculator Functionality

Every amount field across the application (transactions, account balances, scheduled transactions, physical assets, and account splits) includes a built-in inline calculator. You can type mathematical expressions directly into any amount input.

**Features:**

- **Inline Evaluation**: Type expressions directly into any amount field; the result is calculated in place
- **Live Preview**: As you type an expression, a small preview (with a calculator icon) appears below the input showing the evaluated result in real time
- **Mathematical Operations**: Support for addition (+), subtraction (-), multiplication (\*), and division (/)
- **Parentheses Grouping**: Use parentheses to group operations and control calculation order
- **Auto-Evaluation on Blur**: When you leave the field, the expression is automatically evaluated and replaced with the result
- **Keyboard Support**: Press Enter to evaluate the expression immediately
- **Formatted Output**: Results are displayed as formatted prices (e.g., `$1,250.00`)

**Usage Examples:**

- `10 + 5` → Calculates 15
- `20 * 0.15` → Calculates 3 (15% of 20)
- `(100 - 10) / 2` → Calculates 45 (subtract 10 from 100, then divide by 2)
- `50 + 25 * 2` → Calculates 100 (multiplication before addition)
- `(85.40 + 85.40 * 0.18) / 4` → Calculates 25.24 (restaurant bill with 18% tip, split 4 ways)
- `1000 * (1 + 0.07)^10` → Calculates 1967.15 (value of $1,000 after 10 years at 7% annual compound interest)

![Compound interest example](docs/assets/calculator_input.png)

**How to Use:**

1. Click on any amount field and type a mathematical expression (e.g., `100 + 50`)
2. A live preview of the result appears below the input as you type
3. Press Enter or click outside the field to evaluate and apply the result
4. The field updates with the formatted calculated amount

**Error Handling:**

- Invalid mathematical expressions are silently ignored — the field retains its current value
- Empty fields default to 0
- Results are rounded to 2 decimal places to avoid floating-point precision issues

This calculator feature streamlines the transaction recording process, especially useful for:

- Calculating taxes and fees
- Computing discounts and percentages
- Splitting bills and expenses
- Converting currencies or units
- Complex financial calculations
