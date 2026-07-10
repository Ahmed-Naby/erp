export const ACCOUNT_CODES = {
  CASH: "1000",
  ACCOUNTS_RECEIVABLE: "1100",
  INVENTORY: "1200",
  TAX_RECEIVABLE: "1300",
  ACCOUNTS_PAYABLE: "2000",
  TAX_PAYABLE: "2100",
  OWNERS_EQUITY: "3000",
  SALES_REVENUE: "4000",
  COST_OF_GOODS_SOLD: "5000",
  OPERATING_EXPENSES: "5100",
  SALARY_EXPENSE: "5200",
} as const

export const DEFAULT_ACCOUNTS: { code: string; name: string; type: string }[] = [
  { code: ACCOUNT_CODES.CASH, name: "Cash", type: "ASSET" },
  { code: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, name: "Accounts Receivable", type: "ASSET" },
  { code: ACCOUNT_CODES.INVENTORY, name: "Inventory", type: "ASSET" },
  { code: ACCOUNT_CODES.TAX_RECEIVABLE, name: "Input Tax Receivable", type: "ASSET" },
  { code: ACCOUNT_CODES.ACCOUNTS_PAYABLE, name: "Accounts Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.TAX_PAYABLE, name: "Sales Tax Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.OWNERS_EQUITY, name: "Owner's Equity", type: "EQUITY" },
  { code: ACCOUNT_CODES.SALES_REVENUE, name: "Sales Revenue", type: "REVENUE" },
  { code: ACCOUNT_CODES.COST_OF_GOODS_SOLD, name: "Cost of Goods Sold", type: "EXPENSE" },
  { code: ACCOUNT_CODES.OPERATING_EXPENSES, name: "Operating Expenses", type: "EXPENSE" },
  { code: ACCOUNT_CODES.SALARY_EXPENSE, name: "Salary Expense", type: "EXPENSE" },
]
