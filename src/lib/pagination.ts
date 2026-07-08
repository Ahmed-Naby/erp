export const PAGE_SIZE = 20

/** Parse a 1-based page number from a search param, defaulting to 1. */
export function parsePage(value: string | undefined): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : 1
}

/** Prisma skip/take for a given page. */
export function pageArgs(page: number, size: number = PAGE_SIZE) {
  return { skip: (page - 1) * size, take: size }
}

/** Total number of pages for a row count (never less than 1). */
export function pageCount(total: number, size: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size))
}
