import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import {
  advancePaymentStatus,
  approveInvoice,
  deleteInvoice,
  listInvoices,
  saveInvoice,
  type ApprovalStatus,
  type Invoice,
  type InvoiceInput,
} from "@/lib/invoices.functions";
import { filterBySearch } from "@/lib/invoice-format";
import { InvoiceTable } from "@/components/payables/invoice-table";
import { DeleteInvoiceModal, InvoiceFormModal } from "@/components/payables/invoice-form-modal";
import {
  ApprovalsIcon,
  BellIcon,
  BrandIcon,
  InvoicesIcon,
  OverviewIcon,
  PaymentsIcon,
  PlusIcon,
  SearchIcon,
  StatDueIcon,
  StatInvoicesIcon,
  StatPaidIcon,
  StatPendingIcon,
} from "@/components/payables/icons";

export const Route = createFileRoute("/")({
  // Runs on the server for the first page load (SSR) and via /_serverFn on client navigation.
  loader: () => listInvoices(),
  component: PayableControl,
});

type View = "overview" | "invoices" | "approvals" | "payments";
type PaymentTab = "all" | "unpaid" | "paid";

const VIEW_NAMES: Record<View, string> = {
  overview: "Overview",
  invoices: "Invoices",
  approvals: "Approvals",
  payments: "Payments",
};

const APPROVAL_TITLES: Record<ApprovalStatus, string> = {
  Pending: "Awaiting review",
  Approved: "Approved invoices",
  Rejected: "Rejected invoices",
};

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="search">
      <SearchIcon />
      <input
        placeholder="Search invoices"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn primary" onClick={onClick}>
      <PlusIcon />
      Add invoice
    </button>
  );
}

function Heading(props: { eyebrow: string; title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="heading">
      <div>
        <div className="eyebrow">{props.eyebrow}</div>
        <h1>{props.title}</h1>
        <p className="sub">{props.sub}</p>
      </div>
      {props.action}
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong.";
}

function PayableControl() {
  const records = Route.useLoaderData();
  const router = useRouter();

  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState<Record<View, string>>({
    overview: "",
    invoices: "",
    approvals: "",
    payments: "",
  });
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | ApprovalStatus>("all");
  const [approvalTab, setApprovalTab] = useState<ApprovalStatus>("Pending");
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);

  const [toastText, setToastText] = useState("");
  const [toastShown, setToastShown] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function toast(text: string) {
    setToastText(text);
    setToastShown(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShown(false), 2400);
  }

  /** Runs a server change, reloads the list from the database, then shows `done` as a toast. */
  async function mutate(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    try {
      await action();
      await router.invalidate();
      toast(done);
      return true;
    } catch (error) {
      toast(errorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openForm(id?: string) {
    setEditing(records.find((r) => r.id === id) ?? null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  async function handleSave(input: InvoiceInput) {
    const ok = await mutate(
      () => saveInvoice({ data: input }),
      input.id ? "Invoice updated" : "Invoice added",
    );
    if (ok) setFormOpen(false);
  }

  function askDelete(id: string) {
    setDeleting(records.find((r) => r.id === id) ?? null);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const ok = await mutate(() => deleteInvoice({ data: { id: deleting.id } }), "Invoice deleted");
    if (ok) setDeleteOpen(false);
  }

  const approve = (id: string) =>
    mutate(() => approveInvoice({ data: { id } }), "Invoice approved");
  const advancePayment = (id: string) =>
    mutate(() => advancePaymentStatus({ data: { id } }), "Payment status updated");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFormOpen(false);
        setDeleteOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const setSearchFor = (v: View) => (value: string) => setSearch((s) => ({ ...s, [v]: value }));

  const pendingCount = records.filter((r) => r.approval === "Pending").length;
  const dueCount = records.filter((r) => r.approval === "Approved" && r.payment !== "Paid").length;
  const paidCount = records.filter((r) => r.approval === "Approved" && r.payment === "Paid").length;

  const recentRows = filterBySearch(records, search.overview).slice().reverse().slice(0, 5);
  const invoiceRows = filterBySearch(records, search.invoices).filter(
    (r) => invoiceFilter === "all" || r.approval === invoiceFilter,
  );
  const approvalRows = filterBySearch(
    records.filter((r) => r.approval === approvalTab),
    search.approvals,
  );
  let paymentRows = records.filter((r) => r.approval === "Approved");
  if (paymentTab === "unpaid") paymentRows = paymentRows.filter((r) => r.payment !== "Paid");
  if (paymentTab === "paid") paymentRows = paymentRows.filter((r) => r.payment === "Paid");
  if (paymentFilter !== "all") paymentRows = paymentRows.filter((r) => r.payment === paymentFilter);
  paymentRows = filterBySearch(paymentRows, search.payments);

  const tableProps = {
    approvalTab,
    onAdd: () => openForm(),
    onEdit: openForm,
    onDelete: askDelete,
    onApprove: approve,
    onAdvancePayment: advancePayment,
  };

  const navItems: { view: View; icon: ReactNode; extra?: ReactNode }[] = [
    { view: "overview", icon: <OverviewIcon /> },
    { view: "invoices", icon: <InvoicesIcon /> },
    {
      view: "approvals",
      icon: <ApprovalsIcon />,
      extra: (
        <span
          id="approvalCount"
          className="status pending"
          style={{
            marginLeft: "auto",
            padding: "3px 7px",
            display: pendingCount ? "inline-flex" : "none",
          }}
        >
          {pendingCount}
        </span>
      ),
    },
    { view: "payments", icon: <PaymentsIcon /> },
  ];

  const sectionClass = (v: View) => `view${view === v ? " show" : ""}`;

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">
              <BrandIcon />
            </div>
            <span>Payable Control</span>
          </div>
          <div className="workspace">Workspace</div>
          <nav className="nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.view}
                className={view === item.view ? "active" : ""}
                data-view={item.view}
                onClick={() => setView(item.view)}
              >
                {item.icon}
                {VIEW_NAMES[item.view]}
                {item.extra}
              </button>
            ))}
          </nav>
          <div className="side-bottom">
            <div className="profile">
              <div className="avatar">SC</div>
              <span>Finance team</span>
            </div>
            Invoice control workspace
          </div>
        </aside>
        <main className="main">
          <header className="topbar">
            <div className="crumb">
              Finance <span style={{ color: "#c6cec9", margin: "0 6px" }}>/</span>{" "}
              <span id="crumbView">{VIEW_NAMES[view]}</span>
            </div>
            <div className="top-right">
              <span className="period">July – September 2026</span>
              <button className="icon-button" aria-label="Notifications">
                <BellIcon />
              </button>
            </div>
          </header>
          <div className="content">
            <section className={sectionClass("overview")} id="view-overview">
              <Heading
                eyebrow="Payables workspace"
                title="Good morning"
                sub="Track invoices, approvals, and payment status in one place."
                action={<AddButton onClick={() => openForm()} />}
              />
              <div className="stats">
                <div className="stat">
                  <div className="stat-top">
                    <span>Total invoices</span>
                    <span className="stat-icon">
                      <StatInvoicesIcon />
                    </span>
                  </div>
                  <div className="stat-value">{records.length}</div>
                  <div className="stat-note">In this workspace</div>
                </div>
                <div className="stat">
                  <div className="stat-top">
                    <span>Awaiting approval</span>
                    <span className="stat-icon" style={{ color: "#96620e", background: "#fff5df" }}>
                      <StatPendingIcon />
                    </span>
                  </div>
                  <div className="stat-value">{pendingCount}</div>
                  <div className="stat-note">Needs reviewer action</div>
                </div>
                <div className="stat">
                  <div className="stat-top">
                    <span>Payment due</span>
                    <span className="stat-icon" style={{ color: "#53738b", background: "#eef4f7" }}>
                      <StatDueIcon />
                    </span>
                  </div>
                  <div className="stat-value">{dueCount}</div>
                  <div className="stat-note">Approved, not yet paid</div>
                </div>
                <div className="stat">
                  <div className="stat-top">
                    <span>Paid</span>
                    <span className="stat-icon">
                      <StatPaidIcon />
                    </span>
                  </div>
                  <div className="stat-value">{paidCount}</div>
                  <div className="stat-note">Payment marked complete</div>
                </div>
              </div>
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Recent invoices</div>
                    <div className="card-caption">Latest invoices in your payable list</div>
                  </div>
                  <div className="tools">
                    <SearchBox value={search.overview} onChange={setSearchFor("overview")} />
                    <button className="btn small" onClick={() => setView("invoices")}>
                      View all
                    </button>
                  </div>
                </div>
                <InvoiceTable rows={recentRows} scope="overview" {...tableProps} />
              </div>
              <div className="notice">
                Source fields follow your payable list. <b>Approval</b> and <b>payment status</b>{" "}
                are tracked separately.
              </div>
            </section>

            <section className={sectionClass("invoices")} id="view-invoices">
              <Heading
                eyebrow="Records"
                title="Invoices"
                sub="Add, edit, and manage payable records."
                action={<AddButton onClick={() => openForm()} />}
              />
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">All invoices</div>
                    <div className="card-caption">
                      <span id="invoiceCount">{records.length}</span> records
                    </div>
                  </div>
                  <div className="tools">
                    <SearchBox value={search.invoices} onChange={setSearchFor("invoices")} />
                    <select
                      className="select-small"
                      value={invoiceFilter}
                      onChange={(e) => setInvoiceFilter(e.target.value as typeof invoiceFilter)}
                    >
                      <option value="all">All records</option>
                      <option value="Pending">Pending approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <InvoiceTable rows={invoiceRows} scope="invoices" {...tableProps} />
              </div>
            </section>

            <section className={sectionClass("approvals")} id="view-approvals">
              <Heading
                eyebrow="Review queue"
                title="Approvals"
                sub="Review invoices before they move to payment."
              />
              <div className="screen-tabs">
                {(["Pending", "Approved", "Rejected"] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`tab${approvalTab === tab ? " active" : ""}`}
                    onClick={() => setApprovalTab(tab)}
                  >
                    {tab === "Pending" ? (
                      <>
                        Awaiting review <span id="pendingTabCount">{` (${pendingCount})`}</span>
                      </>
                    ) : (
                      tab
                    )}
                  </button>
                ))}
              </div>
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title" id="approvalTitle">
                      {APPROVAL_TITLES[approvalTab]}
                    </div>
                    <div className="card-caption">Confirm invoice details before approval.</div>
                  </div>
                  <div className="tools">
                    <SearchBox value={search.approvals} onChange={setSearchFor("approvals")} />
                  </div>
                </div>
                <InvoiceTable rows={approvalRows} scope="approval" {...tableProps} />
              </div>
            </section>

            <section className={sectionClass("payments")} id="view-payments">
              <Heading
                eyebrow="Disbursement"
                title="Payments"
                sub="Update payment progress for approved invoices."
              />
              <div className="screen-tabs">
                {(
                  [
                    ["all", "All payments"],
                    ["unpaid", "To be paid"],
                    ["paid", "Paid"],
                  ] as const
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    className={`tab${paymentTab === tab ? " active" : ""}`}
                    onClick={() => setPaymentTab(tab)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="card">
                <div className="card-head">
                  <div>
                    <div className="card-title">Payment tracking</div>
                    <div className="card-caption">Only approved invoices appear in this view.</div>
                  </div>
                  <div className="tools">
                    <SearchBox value={search.payments} onChange={setSearchFor("payments")} />
                    <select
                      className="select-small"
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      <option>Scheduled</option>
                      <option>Processing</option>
                      <option>Paid</option>
                      <option>On hold</option>
                    </select>
                  </div>
                </div>
                <InvoiceTable rows={paymentRows} scope="payments" {...tableProps} />
              </div>
            </section>
          </div>
        </main>
      </div>

      <InvoiceFormModal
        open={formOpen}
        invoice={editing}
        formKey={formKey}
        saving={busy}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <DeleteInvoiceModal
        open={deleteOpen}
        invoice={deleting}
        busy={busy}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
      <div id="toast" className={`toast${toastShown ? " show" : ""}`} role="status">
        {toastText}
      </div>
    </>
  );
}
