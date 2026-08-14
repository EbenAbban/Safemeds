/**
 * Formats a money value that arrived over the API.
 *
 * Accepts `unknown` on purpose. Prisma's `Decimal` columns — Medication.price,
 * Order.totalAmount, Staff.salary — do not survive JSON as numbers: they arrive
 * as strings. The service types declared `price: number`, so TypeScript was
 * satisfied while the runtime value was "5", and `price.toFixed(2)` threw
 * `toFixed is not a function`, taking the whole medications page down to the
 * error boundary. Anything that renders a Decimal has to coerce first, and
 * doing it in one place is more reliable than remembering to wrap every call.
 *
 * Currency is GHS: SafeMeds serves students in Ghana. The previous formatters
 * were hardcoded to USD, which was wrong for every price in the database.
 */
export function formatCurrency(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  const safe = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(safe);
}
