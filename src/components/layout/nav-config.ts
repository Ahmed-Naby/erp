import {
  Calculator,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
  adminOnly?: boolean
  icon: LucideIcon
  /** Tailwind classes for the app-switcher tile (bg tint + icon color). */
  color: string
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
    items: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    label: "Inventory",
    icon: Package,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
    items: [
      { label: "Products", href: "/inventory/products" },
      { label: "Warehouses", href: "/inventory/warehouses" },
      { label: "Stock Movements", href: "/inventory/stock-movements" },
    ],
  },
  {
    label: "Sales",
    icon: ShoppingCart,
    color: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    items: [
      { label: "Customers", href: "/sales/customers" },
      { label: "Orders", href: "/sales/orders" },
      { label: "Invoices", href: "/sales/invoices" },
    ],
  },
  {
    label: "Purchasing",
    icon: ShoppingBag,
    color: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300",
    items: [
      { label: "Suppliers", href: "/purchasing/suppliers" },
      { label: "Purchase Orders", href: "/purchasing/orders" },
    ],
  },
  {
    label: "Accounting",
    adminOnly: true,
    icon: Calculator,
    color: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
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
    icon: Settings,
    color: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
    items: [
      { label: "Users", href: "/settings/users" },
      { label: "Audit Log", href: "/settings/audit-log" },
    ],
  },
]
