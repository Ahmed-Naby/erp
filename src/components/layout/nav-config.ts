import {
  Calculator,
  Contact,
  Factory,
  LayoutDashboard,
  type LucideIcon,
  Package,
  PieChart,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Target,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from "lucide-react"

export type NavItem = {
  /** i18n key resolved at render time. */
  label: string
  href: string
}

export type NavGroup = {
  /** i18n key resolved at render time. */
  label: string
  items: NavItem[]
  adminOnly?: boolean
  icon: LucideIcon
  /** Tailwind classes for the app-switcher tile (bg tint + icon color). */
  color: string
}

export const navGroups: NavGroup[] = [
  {
    label: "nav.overview",
    icon: LayoutDashboard,
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
    items: [{ label: "nav.dashboard", href: "/dashboard" }],
  },
  {
    label: "nav.inventory",
    icon: Package,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
    items: [
      { label: "nav.products", href: "/inventory/products" },
      { label: "nav.warehouses", href: "/inventory/warehouses" },
      { label: "nav.stockMovements", href: "/inventory/stock-movements" },
    ],
  },
  {
    label: "nav.sales",
    icon: ShoppingCart,
    color: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
    items: [
      { label: "nav.customers", href: "/sales/customers" },
      { label: "nav.orders", href: "/sales/orders" },
      { label: "nav.invoices", href: "/sales/invoices" },
    ],
  },
  {
    label: "nav.purchasing",
    icon: ShoppingBag,
    color: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300",
    items: [
      { label: "nav.suppliers", href: "/purchasing/suppliers" },
      { label: "nav.purchaseOrders", href: "/purchasing/orders" },
    ],
  },
  {
    label: "nav.manufacturing",
    icon: Factory,
    color: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
    items: [
      { label: "nav.manufacturingOrders", href: "/manufacturing/orders" },
      { label: "nav.boms", href: "/manufacturing/boms" },
    ],
  },
  {
    label: "nav.maintenance",
    icon: Wrench,
    color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300",
    items: [
      { label: "nav.maintenanceRequests", href: "/maintenance/requests" },
      { label: "nav.equipment", href: "/maintenance/equipment" },
    ],
  },
  {
    label: "nav.quality",
    icon: ShieldCheck,
    color: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
    items: [{ label: "nav.qualityChecks", href: "/quality" }],
  },
  {
    label: "nav.repair",
    icon: Wrench,
    color: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
    items: [{ label: "nav.repairOrders", href: "/repair" }],
  },
  {
    label: "nav.crm",
    icon: Target,
    color: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
    items: [{ label: "nav.pipeline", href: "/crm" }],
  },
  {
    label: "nav.contacts",
    icon: Contact,
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300",
    items: [{ label: "nav.contacts", href: "/contacts" }],
  },
  {
    label: "nav.employees",
    icon: Users,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
    items: [
      { label: "nav.employees", href: "/hr/employees" },
      { label: "nav.departments", href: "/hr/departments" },
      { label: "nav.timeOff", href: "/hr/time-off" },
      { label: "nav.attendances", href: "/hr/attendances" },
      { label: "nav.appraisals", href: "/hr/appraisals" },
    ],
  },
  {
    label: "nav.recruitment",
    icon: UserPlus,
    color: "bg-lime-100 text-lime-600 dark:bg-lime-500/20 dark:text-lime-300",
    items: [
      { label: "nav.jobPositions", href: "/recruitment/jobs" },
      { label: "nav.applicants", href: "/recruitment/applicants" },
    ],
  },
  {
    label: "nav.expenses",
    icon: Receipt,
    color: "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300",
    items: [{ label: "nav.expenses", href: "/expenses" }],
  },
  {
    label: "nav.payroll",
    icon: Wallet,
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    items: [{ label: "nav.payroll", href: "/hr/payroll" }],
  },
  {
    label: "nav.equity",
    adminOnly: true,
    icon: PieChart,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300",
    items: [
      { label: "nav.capTable", href: "/equity/shareholders" },
      { label: "nav.shareClasses", href: "/equity/classes" },
    ],
  },
  {
    label: "nav.accounting",
    adminOnly: true,
    icon: Calculator,
    color: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    items: [
      { label: "nav.chartOfAccounts", href: "/accounting/accounts" },
      { label: "nav.journal", href: "/accounting/journal" },
      { label: "nav.payments", href: "/accounting/payments" },
      { label: "nav.reports", href: "/accounting/reports" },
    ],
  },
  {
    label: "nav.settings",
    adminOnly: true,
    icon: Settings,
    color: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
    items: [
      { label: "nav.users", href: "/settings/users" },
      { label: "nav.auditLog", href: "/settings/audit-log" },
    ],
  },
]
