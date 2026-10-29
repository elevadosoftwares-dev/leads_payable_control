import type { ApprovalStatus, Invoice } from "@/lib/invoices.functions";
import { dateText, money, statusClass } from "@/lib/invoice-format";
import { DeleteIcon, EditIcon } from "@/components/payables/icons";

export type TableScope = "overview" | "invoices" | "approval" | "payments";

type Props = {
  rows: Invoice[];
  scope: TableScope;
  approvalTab: ApprovalStatus;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onAdvancePayment: (id: string) => void;
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={`status ${statusClass(value)}`}>{value}</span>;
}

function emptyMessage(scope: TableScope) {
  if (scope === "approval") {
    return "There are no invoices in this approval view. New invoices can start in the approval queue.";
  }
  if (scope === "payments") {
    return "No matching approved invoices. Update an invoice status to track payment progress.";
  }
  return "No invoices match your search.";
}

export function InvoiceTable(props: Props) {
  const { rows, scope, approvalTab } = props;

  if (!rows.length) {
    return (
      <div className="empty">
        <div className="stat-icon" style={{ margin: "0 auto", width: 38, height: 38 }}>
          ✓
        </div>
        <strong>Nothing to review</strong>
        <p>{emptyMessage(scope)}</p>
        {scope === "approval" && approvalTab === "Pending" && (
          <button className="btn primary small" onClick={props.onAdd}>
            Add invoice
          </button>
        )}
      </div>
    );
  }

  const showPayment = scope === "approval" || scope === "payments";

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Supplier</th>
            <th>Description</th>
            <th>Invoice date</th>
            <th>Total</th>
            <th>Approval</th>
            {showPayment && <th>Payment</th>}
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="mono">{r.number}</div>
                <div className="inline-note">{r.owner || "No owner"}</div>
              </td>
              <td>
                <div className="supplier" title={r.supplier}>
                  {r.supplier}
                </div>
                <div className="inline-note">{r.department || ""}</div>
              </td>
              <td>
                <div className="desc" title={r.description}>
                  {r.description || "—"}
                </div>
              </td>
              <td className="mono">{dateText(r.date)}</td>
              <td>
                <div className="amount">{money(r.total, r.currency)}</div>
                <div className="inline-note">{money(r.amount, r.currency)} + GST</div>
              </td>
              <td>
                <StatusBadge value={r.approval} />
              </td>
              {showPayment && (
                <td>
                  <StatusBadge value={r.payment} />
                </td>
              )}
              <td>
                <div className="actions">
                  {scope === "approval" && r.approval === "Pending" && (
                    <button className="btn small" onClick={() => props.onApprove(r.id)}>
                      Approve
                    </button>
                  )}
                  {scope === "payments" && r.approval === "Approved" && (
                    <button className="btn small" onClick={() => props.onAdvancePayment(r.id)}>
                      Update status
                    </button>
                  )}
                  <button
                    className="action"
                    title="Edit invoice"
                    aria-label="Edit invoice"
                    onClick={() => props.onEdit(r.id)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="action"
                    title="Delete invoice"
                    aria-label="Delete invoice"
                    onClick={() => props.onDelete(r.id)}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
