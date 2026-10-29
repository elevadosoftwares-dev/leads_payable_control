-- Payable Control - SQL Server schema.
-- Applied automatically when the app first connects (src/server/db.server.ts), after creating
-- the database if needed. Safe to re-run: every object is created only if it does not exist.
-- Separate batches with a line containing only GO. To apply by hand:
--   sqlcmd -S <server> -U <user> -P <password> -d leads_payable -i database/schema.sql

SET NOCOUNT ON;

-- Payable invoices. Approval and payment status are tracked separately; only approved invoices
-- appear in the Payments view. row_no keeps the order records were added, which the UI uses for
-- "Recent invoices". total is computed from amount + gst.
IF OBJECT_ID(N'dbo.invoices', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.invoices (
    id                    UNIQUEIDENTIFIER NOT NULL
      CONSTRAINT pk_invoices PRIMARY KEY NONCLUSTERED DEFAULT NEWID(),
    row_no                INT IDENTITY(1, 1) NOT NULL
      CONSTRAINT uq_invoices_row_no UNIQUE CLUSTERED,
    invoice_number        NVARCHAR(100)    NOT NULL
      CONSTRAINT ck_invoices_number CHECK (LEN(invoice_number) >= 1),
    invoice_date          DATE             NOT NULL,
    supplier              NVARCHAR(200)    NOT NULL
      CONSTRAINT ck_invoices_supplier CHECK (LEN(supplier) >= 1),
    description           NVARCHAR(1000)   NOT NULL CONSTRAINT df_invoices_description DEFAULT N'',
    currency              CHAR(3)          NOT NULL CONSTRAINT df_invoices_currency DEFAULT 'SGD'
      CONSTRAINT ck_invoices_currency CHECK (currency IN ('SGD', 'INR')),
    amount                DECIMAL(18, 2)   NOT NULL
      CONSTRAINT ck_invoices_amount CHECK (amount >= 0),
    gst                   DECIMAL(18, 2)   NOT NULL CONSTRAINT df_invoices_gst DEFAULT 0
      CONSTRAINT ck_invoices_gst CHECK (gst >= 0),
    total                 AS (amount + gst) PERSISTED,
    payment_terms         NVARCHAR(100)    NOT NULL CONSTRAINT df_invoices_terms DEFAULT N'',
    invoice_owner         NVARCHAR(200)    NOT NULL CONSTRAINT df_invoices_owner DEFAULT N'',
    department            NVARCHAR(200)    NOT NULL CONSTRAINT df_invoices_department DEFAULT N'—',
    entered_in_quickbooks BIT              NOT NULL CONSTRAINT df_invoices_qb DEFAULT 0,
    approval_status       NVARCHAR(20)     NOT NULL CONSTRAINT df_invoices_approval DEFAULT N'Pending'
      CONSTRAINT ck_invoices_approval CHECK (approval_status IN (N'Pending', N'Approved', N'Rejected')),
    payment_status        NVARCHAR(20)     NOT NULL CONSTRAINT df_invoices_payment DEFAULT N'Scheduled'
      CONSTRAINT ck_invoices_payment
        CHECK (payment_status IN (N'Scheduled', N'Processing', N'Paid', N'On hold')),
    remark                NVARCHAR(4000)   NOT NULL CONSTRAINT df_invoices_remark DEFAULT N'',
    created_at            DATETIME2(3)     NOT NULL CONSTRAINT df_invoices_created_at DEFAULT SYSUTCDATETIME(),
    updated_at            DATETIME2(3)     NOT NULL CONSTRAINT df_invoices_updated_at DEFAULT SYSUTCDATETIME()
  );

  -- The sample records from the source payable workbook (one statement each to keep their order).
  INSERT INTO dbo.invoices (invoice_date, invoice_number, supplier, description, amount, gst, currency,
                            payment_terms, invoice_owner, department, entered_in_quickbooks, remark,
                            approval_status, payment_status)
  VALUES ('2026-07-02', N'2610022269', N'Flo Energy Singapore Pte. Ltd.', N'Electricity Supply Charge',
          1827.83, 164.50, 'SGD', N'2 Jul 2026', N'Leads Specialist', N'—', 0, N'', N'Approved', N'Paid');
  INSERT INTO dbo.invoices (invoice_date, invoice_number, supplier, description, amount, gst, currency,
                            payment_terms, invoice_owner, department, entered_in_quickbooks, remark,
                            approval_status, payment_status)
  VALUES ('2026-07-03', N'INV26071059', N'SKYLINK VEHICLE RENTAL PTE. LTD',
          N'Rental for 1 Month @2,200.00 per Month - YR4346K', 2200, 198, 'SGD', N'Immediate',
          N'Leads Specialist', N'—', 0, N'Balance - S$ 109.00', N'Approved', N'Paid');
  INSERT INTO dbo.invoices (invoice_date, invoice_number, supplier, description, amount, gst, currency,
                            payment_terms, invoice_owner, department, entered_in_quickbooks, remark,
                            approval_status, payment_status)
  VALUES ('2026-07-16', N'INV26070774', N'SKYLINK VEHICLE RENTAL PTE. LTD',
          N'Rental for 1 Month @1,800.00 per Month - GBH5616A', 1800, 162, 'SGD', N'Immediate',
          N'Leads Specialist', N'—', 0, N'', N'Approved', N'Paid');
  INSERT INTO dbo.invoices (invoice_date, invoice_number, supplier, description, amount, gst, currency,
                            payment_terms, invoice_owner, department, entered_in_quickbooks, remark,
                            approval_status, payment_status)
  VALUES ('2026-07-01', N'NA', N'Ambika', N'Thanjavur Expenses', 50000, 0, 'INR', N'Immediate',
          N'Leads Specialist', N'No', 0, N'Balance in Tnj expense- ₹ 6919.82.', N'Approved', N'Paid');
END
