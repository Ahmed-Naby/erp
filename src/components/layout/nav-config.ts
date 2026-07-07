export type NavItem = {
  label: string
  href: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
  adminOnly?: boolean
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    label: "Inventory",
    items: [
      { label: "Products", href: "/inventory/products" },
      { label: "Warehouses", href: "/inventory/warehouses" },
      { label: "Stock Movements", href: "/inventory/stock-movements" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Customers", href: "/sales/customers" },
      { label: "Orders", href: "/sales/orders" },
      { label: "Invoices", href: "/sales/invoices" },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { label: "Suppliers", href: "/purchasing/suppliers" },
      { label: "Purchase Orders", href: "/purchasing/orders" },
    ],
  },
  {
    label: "Accounting",
    adminOnly: true,
    items: [
      { label: "Chart of Accounts", href: "/accounting/accounts" },
      { label: "Journal", href: "/accounting/journal" },
      { label: "Payments", href: "/accounting/payments" },
      { label: "Reports", href: "/accounting/reports" },
    ],
  },
  {
    label: "Settings",
    adminOnly: true,
    items: [
      { label: "Users", href: "/settings/users" },
      { label: "Audit Log", href: "/settings/audit-log" },
    ],
  },
]
