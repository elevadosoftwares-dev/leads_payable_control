import { createServerFn } from "@tanstack/react-start";

export const CURRENCIES = ["SGD", "INR"] as const;
export const APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"] as const;
/** Also the order "Update status" steps through on the Payments view. */
export const PAYMENT_STATUSES = ["Scheduled", "Processing", "Paid", "On hold"] as const;

export type Currency = (typeof CURRENCIES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type Invoice = {
  id: string;
  /** Invoice date as YYYY-MM-DD. */
  date: string;
  number: string;
  supplier: string;
  description: string;
  amount: number;
  gst: number;
  total: number;
  currency: Currency;
  terms: string;
  owner: string;
  department: string;
  qb: "Yes" | "No";
  remark: string;
  approval: ApprovalStatus;
  payment: PaymentStatus;
};

export type InvoiceInput = Omit<Invoice, "id" | "total"> & { id?: string };

type InvoiceRow = {
  id: string;
  invoice_date: string;
  invoice_number: string;
  supplier: string;
  description: string;
  amount: number;
  gst: number;
  total: number;
  currency: Currency;
  payment_terms: string;
  invoice_owner: string;
  department: string;
  entered_in_quickbooks: boolean;
  remark: string;
  approval_status: ApprovalStatus;
  payment_status: PaymentStatus;
};

const SELECT_INVOICES = `SELECT id, CONVERT(CHAR(10), invoice_date, 23) AS invoice_date, invoice_number,
  supplier, description, amount, gst, total, currency, payment_terms, invoice_owner, department,
  entered_in_quickbooks, remark, approval_status, payment_status FROM dbo.invoices`;

function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id.toLowerCase(),
    date: row.invoice_date,
    number: row.invoice_number,
    supplier: row.supplier,
    description: row.description,
    amount: Number(row.amount),
    gst: Number(row.gst),
    total: Number(row.total),
    currency: row.currency,
    terms: row.payment_terms,
    owner: row.invoice_owner,
    department: row.department,
    qb: row.entered_in_quickbooks ? "Yes" : "No",
    remark: row.remark,
    approval: row.approval_status,
    payment: row.payment_status,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateId(input: { id: string }) {
  if (!input?.id || !UUID.test(input.id)) throw new Error("Missing invoice.");
  return { id: input.id };
}

function text(value: unknown, label: string, max: number, required = false) {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new Error(`${label} is required.`);
  if (result.length > max) throw new Error(`${label} must be ${max} characters or less.`);
  return result;
}

function money(value: unknown, label: string) {
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0) throw new Error(`${label} must be 0 or more.`);
  if (result >= 1e16) throw new Error(`${label} is too large.`);
  return Math.round(result * 100) / 100;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) throw new Error(`${label} is not valid.`);
  return value as T;
}

/** Every invoice, in the order it was added. */
export const listInvoices = createServerFn({ method: "GET" }).handler(async () => {
  const { request } = await import("@/server/db.server");
  const req = await request();
  const { recordset } = await req.query<InvoiceRow>(`${SELECT_INVOICES} ORDER BY row_no`);
  return recordset.map(toInvoice);
});

/** Adds an invoice, or replaces every field of an existing one when `id` is given. */
export const saveInvoice = createServerFn({ method: "POST" })
  .validator((input: InvoiceInput) => {
    const date = text(input?.date, "Invoice date", 10, true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      throw new Error("Invoice date is not valid.");
    }
    if (input.id) validateId({ id: input.id });
    return {
      ...(input.id ? { id: input.id } : {}),
      date,
      number: text(input.number, "Invoice number", 100, true),
      supplier: text(input.supplier, "Supplier", 200, true),
      description: text(input.description, "Description", 1000),
      amount: money(input.amount, "Amount before GST"),
      gst: money(input.gst, "GST amount"),
      currency: oneOf(input.currency, CURRENCIES, "Currency"),
      terms: text(input.terms, "Payment term", 100),
      owner: text(input.owner, "Invoice owner", 200),
      department: text(input.department, "Department", 200) || "—",
      qb: oneOf(input.qb, ["Yes", "No"] as const, "Entered in QuickBooks"),
      remark: text(input.remark, "Remark", 4000),
      approval: oneOf(input.approval, APPROVAL_STATUSES, "Approval status"),
      payment: oneOf(input.payment, PAYMENT_STATUSES, "Payment status"),
    };
  })
  .handler(async ({ data }) => {
    const { request, sql } = await import("@/server/db.server");
    const req = (await request())
      .input("invoice_date", sql.Date, new Date(`${data.date}T00:00:00Z`))
      .input("invoice_number", sql.NVarChar(100), data.number)
      .input("supplier", sql.NVarChar(200), data.supplier)
      .input("description", sql.NVarChar(1000), data.description)
      .input("amount", sql.Decimal(18, 2), data.amount)
      .input("gst", sql.Decimal(18, 2), data.gst)
      .input("currency", sql.Char(3), data.currency)
      .input("payment_terms", sql.NVarChar(100), data.terms)
      .input("invoice_owner", sql.NVarChar(200), data.owner)
      .input("department", sql.NVarChar(200), data.department)
      .input("entered_in_quickbooks", sql.Bit, data.qb === "Yes")
      .input("remark", sql.NVarChar(4000), data.remark)
      .input("approval_status", sql.NVarChar(20), data.approval)
      .input("payment_status", sql.NVarChar(20), data.payment);

    if (data.id) {
      const { rowsAffected } = await req.input("id", sql.UniqueIdentifier, data.id).query(
        `UPDATE dbo.invoices
            SET invoice_date = @invoice_date, invoice_number = @invoice_number,
                supplier = @supplier, description = @description, amount = @amount, gst = @gst,
                currency = @currency, payment_terms = @payment_terms,
                invoice_owner = @invoice_owner, department = @department,
                entered_in_quickbooks = @entered_in_quickbooks, remark = @remark,
                approval_status = @approval_status, payment_status = @payment_status,
                updated_at = SYSUTCDATETIME()
          WHERE id = @id`,
      );
      if (!rowsAffected[0]) throw new Error("This invoice no longer exists.");
    } else {
      await req.query(
        `INSERT INTO dbo.invoices (invoice_date, invoice_number, supplier, description, amount, gst,
                                   currency, payment_terms, invoice_owner, department,
                                   entered_in_quickbooks, remark, approval_status, payment_status)
         VALUES (@invoice_date, @invoice_number, @supplier, @description, @amount, @gst,
                 @currency, @payment_terms, @invoice_owner, @department,
                 @entered_in_quickbooks, @remark, @approval_status, @payment_status)`,
      );
    }
    return { ok: true };
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .validator(validateId)
  .handler(async ({ data }) => {
    const { request, sql } = await import("@/server/db.server");
    const req = await request();
    await req
      .input("id", sql.UniqueIdentifier, data.id)
      .query(`DELETE FROM dbo.invoices WHERE id = @id`);
    return { ok: true };
  });

export const approveInvoice = createServerFn({ method: "POST" })
  .validator(validateId)
  .handler(async ({ data }) => {
    const { request, sql } = await import("@/server/db.server");
    const req = await request();
    const { rowsAffected } = await req.input("id", sql.UniqueIdentifier, data.id).query(
      `UPDATE dbo.invoices
          SET approval_status = N'Approved', updated_at = SYSUTCDATETIME()
        WHERE id = @id`,
    );
    if (!rowsAffected[0]) throw new Error("This invoice no longer exists.");
    return { ok: true };
  });

/** Moves the payment status one step: Scheduled → Processing → Paid → On hold → Scheduled. */
export const advancePaymentStatus = createServerFn({ method: "POST" })
  .validator(validateId)
  .handler(async ({ data }) => {
    const { request, sql } = await import("@/server/db.server");
    const req = await request();
    // Computed in SQL so two people clicking at once still step from the stored value.
    const { rowsAffected } = await req.input("id", sql.UniqueIdentifier, data.id).query(
      `UPDATE dbo.invoices
          SET payment_status = CASE payment_status
                WHEN N'Scheduled'  THEN N'Processing'
                WHEN N'Processing' THEN N'Paid'
                WHEN N'Paid'       THEN N'On hold'
                ELSE N'Scheduled'
              END,
              updated_at = SYSUTCDATETIME()
        WHERE id = @id`,
    );
    if (!rowsAffected[0]) throw new Error("This invoice no longer exists.");
    return { ok: true };
  });
