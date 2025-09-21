# Obsidian Simple Budget Helper

A simple budget helper for [Obsidian](https://obsidian.md)

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
