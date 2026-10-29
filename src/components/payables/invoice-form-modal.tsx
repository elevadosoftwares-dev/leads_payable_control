import { useEffect, useRef, type FormEvent, type MouseEvent } from "react";

import type { Invoice, InvoiceInput } from "@/lib/invoices.functions";

type Props = {
  open: boolean;
  /** The invoice being edited, or null when adding a new one. */
  invoice: Invoice | null;
  /** Changes every time the form is opened, so the fields start fresh. */
  formKey: number;
  saving: boolean;
  onClose: () => void;
  onSave: (input: InvoiceInput) => void;
};

function closeOnBackdrop(onClose: () => void) {
  return (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
}

export function InvoiceFormModal({ open, invoice, formKey, saving, onClose, onSave }: Props) {
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => firstField.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [open, formKey]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const value = (name: string) => String(f.get(name) ?? "");
    onSave({
      ...(invoice ? { id: invoice.id } : {}),
      date: value("invoiceDate"),
      number: value("invoiceNo").trim(),
      supplier: value("supplier").trim(),
      description: value("description").trim(),
      amount: Number(value("amount")),
      gst: Number(value("gst")),
      currency: value("currency") as InvoiceInput["currency"],
      terms: value("terms").trim(),
      owner: value("owner").trim(),
      department: value("department").trim() || "—",
      qb: value("qb") as InvoiceInput["qb"],
      remark: value("remark").trim(),
      approval: value("approval") as InvoiceInput["approval"],
      payment: value("payment") as InvoiceInput["payment"],
    });
  }

  const r = invoice;

  return (
    <div
      className={`modal-backdrop${open ? " open" : ""}`}
      id="formModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="formTitle"
      onClick={closeOnBackdrop(onClose)}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2 id="formTitle">{r ? "Edit invoice" : "Add invoice"}</h2>
            <p>Enter the invoice details and choose its starting status.</p>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="form" id="invoiceForm" key={formKey} onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="invoiceNo">Invoice number *</label>
              <input
                ref={firstField}
                id="invoiceNo"
                name="invoiceNo"
                required
                placeholder="e.g. INV-260701"
                defaultValue={r?.number ?? ""}
              />
            </div>
            <div className="field">
              <label htmlFor="invoiceDate">Invoice date *</label>
              <input
                id="invoiceDate"
                name="invoiceDate"
                type="date"
                required
                defaultValue={r ? r.date : new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="field">
              <label htmlFor="supplier">Supplier *</label>
              <input
                id="supplier"
                name="supplier"
                required
                placeholder="Supplier name"
                defaultValue={r?.supplier ?? ""}
              />
            </div>
            <div className="field">
              <label htmlFor="owner">Invoice owner</label>
              <input
                id="owner"
                name="owner"
                placeholder="Owner name"
                defaultValue={r?.owner ?? ""}
              />
            </div>
            <div className="field full">
              <label htmlFor="description">Description</label>
              <input
                id="description"
                name="description"
                placeholder="What is this invoice for?"
                defaultValue={r?.description ?? ""}
              />
            </div>
            <div className="field">
              <label htmlFor="currency">Currency</label>
              <select id="currency" name="currency" defaultValue={r?.currency ?? "SGD"}>
                <option value="SGD">SGD · Singapore dollar</option>
                <option value="INR">INR · Indian rupee</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="amount">Amount before GST *</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                defaultValue={r ? String(r.amount) : ""}
              />
            </div>
            <div className="field">
              <label htmlFor="gst">GST amount</label>
              <input
                id="gst"
                name="gst"
                type="number"
                min="0"
                step="0.01"
                defaultValue={r ? String(r.gst) : "0"}
              />
            </div>
            <div className="field">
              <label htmlFor="terms">Payment term</label>
              <input
                id="terms"
                name="terms"
                placeholder="e.g. Immediate, 30 days"
                defaultValue={r?.terms ?? ""}
              />
            </div>
            <div className="field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                placeholder="Department"
                defaultValue={r && r.department !== "—" ? r.department : ""}
              />
            </div>
            <div className="field">
              <label htmlFor="qb">Entered in QuickBooks</label>
              <select id="qb" name="qb" defaultValue={r?.qb ?? "No"}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="approval">Approval status</label>
              <select id="approval" name="approval" defaultValue={r?.approval ?? "Pending"}>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="payment">Payment status</label>
              <select id="payment" name="payment" defaultValue={r?.payment ?? "Scheduled"}>
                <option>Scheduled</option>
                <option>Processing</option>
                <option>Paid</option>
                <option>On hold</option>
              </select>
            </div>
            <div className="field full">
              <label htmlFor="remark">Remark</label>
              <textarea
                id="remark"
                name="remark"
                placeholder="Add a note or payment reference"
                defaultValue={r?.remark ?? ""}
              />
            </div>
          </div>
          <div className="form-foot">
            <span>* Required fields</span>
            <div className="form-actions">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn primary" id="saveButton" disabled={saving}>
                {r ? "Save changes" : "Save invoice"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteProps = {
  invoice: Invoice | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteInvoiceModal({ invoice, open, busy, onClose, onConfirm }: DeleteProps) {
  return (
    <div
      className={`modal-backdrop${open ? " open" : ""}`}
      id="deleteModal"
      role="dialog"
      aria-modal="true"
      onClick={closeOnBackdrop(onClose)}
    >
      <div className="modal" style={{ width: "min(420px,100%)" }}>
        <div className="modal-head">
          <div>
            <h2>Delete invoice?</h2>
            <p>This will remove the invoice from this workspace.</p>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="confirm-copy" id="deleteCopy">
          {`${invoice?.number || "This invoice"} · ${invoice?.supplier || ""}`}
        </div>
        <div className="form-foot" style={{ margin: "0 23px 20px" }}>
          <span>This action cannot be undone.</span>
          <div className="form-actions">
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn"
              style={{ background: "#a4433b", color: "#fff", borderColor: "#a4433b" }}
              onClick={onConfirm}
              disabled={busy}
            >
              Delete invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
