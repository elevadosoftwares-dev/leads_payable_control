// Inline SVG icons used across the payables screens. Stroke and size come from the CSS of the
// element they sit in (.nav svg, .btn svg, .action svg, ...).

export function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4.5h14v15H5z" />
      <path d="M8 8h8M8 12h5M8 16h8" />
    </svg>
  );
}

export function OverviewIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

export function InvoicesIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 12h7M9 16h7" />
    </svg>
  );
}

export function ApprovalsIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

export function PaymentsIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
    </svg>
  );
}

export function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
    </svg>
  );
}

export function StatInvoicesIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" />
    </svg>
  );
}

export function StatPendingIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function StatDueIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function StatPaidIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M20 7 10 17l-5-5" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
