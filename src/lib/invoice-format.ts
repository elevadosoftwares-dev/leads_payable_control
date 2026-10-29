import type { Invoice } from "@/lib/invoices.functions";

export function dateText(value: string) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-SG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

export function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currency || "SGD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

const STATUS_CLASSES: Record<string, string> = {
  Approved: "approved",
  Pending: "pending",
  Rejected: "rejected",
  Paid: "paid",
  Scheduled: "scheduled",
  Processing: "processing",
  "On hold": "hold",
};

export function statusClass(status: string) {
  return STATUS_CLASSES[status] ?? "pending";
}

/** Matches the search box against invoice number, supplier, description, owner, department and remark. */
export function filterBySearch(rows: Invoice[], search: string) {
  const query = search.trim().toLowerCase();
  return rows.filter((r) =>
    [r.number, r.supplier, r.description, r.owner, r.department, r.remark]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
}
