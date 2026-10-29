import { describe, expect, it } from "vitest";

import type { Invoice } from "@/lib/invoices.functions";
import { dateText, filterBySearch, money, statusClass } from "@/lib/invoice-format";

const invoice = (overrides: Partial<Invoice>): Invoice => ({
  id: "00000000-0000-0000-0000-000000000001",
  date: "2026-07-02",
  number: "INV-1",
  supplier: "Supplier",
  description: "",
  amount: 100,
  gst: 9,
  total: 109,
  currency: "SGD",
  terms: "",
  owner: "",
  department: "—",
  qb: "No",
  remark: "",
  approval: "Pending",
  payment: "Scheduled",
  ...overrides,
});

describe("invoice formatting", () => {
  it("formats dates and amounts like the original app", () => {
    expect(dateText("2026-07-02")).toBe("02 Jul 2026");
    expect(dateText("")).toBe("—");
    expect(money(1992.33, "SGD")).toBe("$1,992.33");
    expect(money(50000, "INR")).toContain("50,000");
  });

  it("maps statuses to badge classes", () => {
    expect(statusClass("On hold")).toBe("hold");
    expect(statusClass("Approved")).toBe("approved");
    expect(statusClass("unknown")).toBe("pending");
  });

  it("searches number, supplier, description, owner, department and remark", () => {
    const rows = [
      invoice({ id: "a", supplier: "Flo Energy" }),
      invoice({ id: "b", remark: "Balance in Tnj" }),
    ];
    expect(filterBySearch(rows, "  flo ").map((r) => r.id)).toEqual(["a"]);
    expect(filterBySearch(rows, "tnj").map((r) => r.id)).toEqual(["b"]);
    expect(filterBySearch(rows, "")).toHaveLength(2);
  });
});
