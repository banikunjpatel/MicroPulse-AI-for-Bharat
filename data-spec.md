# MicroPulse — Screen Specification
## Data Input Module · Next.js Implementation Guide

> **Purpose of this document:** Complete specification for all 5 data-input screens. Every developer working on this module should treat this as the ground truth. It covers routing, component structure, state management, API contracts, validation rules, and AWS data flow for each screen.

---

## Table of Contents

1. [Project Structure & Shared Conventions](#1-project-structure--shared-conventions)
2. [Shared Components & Types](#2-shared-components--types)
3. [Screen 1 — SKU Catalog](#3-screen-1--sku-catalog)
4. [Screen 2 — Sales History Upload](#4-screen-2--sales-history-upload)
5. [Screen 3 — Column Mapping](#5-screen-3--column-mapping)
6. [Screen 4 — Current Inventory Input](#6-screen-4--current-inventory-input)
7. [Screen 5 — Stores & PIN Code Setup + Readiness Check](#7-screen-5--stores--pin-code-setup--readiness-check)
8. [Shared Layout: Sidebar Navigation](#8-shared-layout-sidebar-navigation)
9. [API Reference Summary](#9-api-reference-summary)
10. [AWS Data Flow Diagram (Text)](#10-aws-data-flow-diagram-text)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Environment Variables](#12-environment-variables)

---

## 1. Project Structure & Shared Conventions

### Routing

All screens in this module live under the `/setup` route namespace in Next.js App Router.

```
app/
  setup/
    layout.tsx              ← Shared layout: top nav + sidebar
    page.tsx                ← Redirects to /setup/skus
    skus/
      page.tsx              ← Screen 1: SKU Catalog
    sales-history/
      page.tsx              ← Screen 2: Upload (Step 1)
      map-columns/
        page.tsx            ← Screen 3: Column Mapping (Step 2)
      validate/
        page.tsx            ← Step 3 (future)
      confirm/
        page.tsx            ← Step 4 (future)
    inventory/
      page.tsx              ← Screen 4: Inventory Input
    pin-codes/
      page.tsx              ← Screen 5: PIN Codes + Readiness Check
```

### API Layer

All data fetching goes through Next.js Route Handlers (`app/api/...`). These route handlers call AWS API Gateway endpoints. The frontend never calls AWS API Gateway directly.

```
app/api/
  skus/
    route.ts                ← GET (list), POST (create)
    [id]/
      route.ts              ← GET (single), PUT (update), DELETE
  sales-history/
    upload/
      route.ts              ← POST: get S3 presigned URL
    import/
      route.ts              ← POST: trigger Lambda import job
  inventory/
    route.ts                ← GET (list), PUT (bulk update)
  pin-codes/
    route.ts                ← GET (list), POST (create), DELETE
  readiness/
    route.ts                ← GET: check all 4 data inputs
```

### State Management

Use React Query (`@tanstack/react-query`) for all server state. Use `useState`/`useReducer` for local UI state only (e.g. form fields not yet submitted, modal open/close).

### Conventions

- All monetary values stored and transmitted in **paise (integer)**. Display in ₹ by dividing by 100.
- All dates in **ISO 8601 UTC string** format (`"2024-01-15T00:00:00Z"`).
- PIN codes stored as **6-character strings** (not integers) to preserve leading zeros if any.
- All API responses follow the envelope format:
  ```json
  { "success": true, "data": { ... } }
  { "success": false, "error": { "code": "SKU_NOT_FOUND", "message": "..." } }
  ```

---

## 2. Shared Components & Types

### TypeScript Types

Define these in `types/index.ts` and import everywhere.

```typescript
// types/index.ts

export type SKUCategory = 'beverages' | 'snacks' | 'dairy' | 'personal_care' | 'household' | 'other';

export interface SKU {
  id: string;              // e.g. "SKU-001", server-generated
  name: string;            // e.g. "Limca 500ml"
  category: SKUCategory;
  unit_cost_paise: number; // e.g. 1800 = ₹18.00
  lead_time_days: number;  // integer, days from order to delivery
  status: 'active' | 'inactive' | 'no_history';
  created_at: string;
  updated_at: string;
}

export interface PINCode {
  pin_code: string;        // 6-digit string
  area_name: string;       // e.g. "Surat — Adajan"
  region: string;          // e.g. "Gujarat"
  store_count: number;
  status: 'active' | 'inactive';
}

export interface InventoryRecord {
  sku_id: string;
  pin_code: string;
  stock_on_hand: number;   // units
  reorder_point: number;   // units
  last_updated: string;
}

export type InventoryStatus = 'healthy' | 'low' | 'critical';

export interface SalesHistoryUploadSession {
  session_id: string;      // UUID, created when CSV is uploaded to S3
  s3_key: string;
  original_filename: string;
  row_count: number;
  detected_columns: string[];
  status: 'uploaded' | 'mapped' | 'validated' | 'imported';
  created_at: string;
}

export interface ColumnMapping {
  date_col: string;
  sku_id_col: string;
  pin_code_col: string;
  units_sold_col: string;
  unit_price_col?: string;  // optional
}

export interface ReadinessCheck {
  skus: { ok: boolean; count: number };
  sales_history: { ok: boolean; days_of_data: number };
  inventory: { ok: boolean; missing_count: number };
  pin_codes: { ok: boolean; count: number };
  all_clear: boolean;
}
```

### Shared UI Components

These components are used across multiple screens. Build them in `components/setup/`.

```
components/
  setup/
    SetupLayout.tsx         ← Top nav + sidebar wrapper
    SetupSidebar.tsx        ← Left nav with active state
    StatusBadge.tsx         ← Colored badges (healthy/low/critical/ok/warn/danger)
    CategoryTag.tsx         ← Colored category pill (beverages/snacks/dairy etc.)
    PageHeader.tsx          ← Title + description block
    ActionRow.tsx           ← Flex row for buttons + spacer
    DataTable.tsx           ← Generic sortable table wrapper
    EmptyState.tsx          ← "No data yet" placeholder
    ConfirmDialog.tsx       ← Delete confirmation modal
    InlineEditRow.tsx       ← Editable table row (used in SKU & PIN screens)
    ReadinessPanel.tsx      ← Status checklist (used in Screen 5)
```

---

## 3. Screen 1 — SKU Catalog

### Route
`/setup/skus`

### Purpose
This is the product master. Every SKU that MicroPulse will forecast must be registered here. The SageMaker model and Lambda simulation functions reference SKU IDs from this table. If a SKU isn't here, it cannot be forecasted.

### What the user does
- View all registered SKUs in a table
- Add a new SKU via an inline row at the bottom of the table (no modal)
- Edit an existing SKU by clicking "Edit" which turns that row inline-editable
- Delete a SKU (with confirmation dialog — deletions cascade to inventory and forecast records)
- Import multiple SKUs at once via CSV upload
- See a status badge per SKU indicating whether it has sales history attached

---

### Component Tree

```
app/setup/skus/page.tsx
  └── SetupLayout
        ├── SetupSidebar (active: "SKU Catalog")
        └── SKUCatalogPage
              ├── PageHeader
              ├── ActionRow
              │     ├── Button: "+ Add SKU"
              │     ├── Button: "Import CSV"
              │     └── Text: "{count} SKUs total"
              ├── SKUTable
              │     ├── thead (7 columns)
              │     ├── tbody
              │     │     ├── SKURow (read mode) × N
              │     │     ├── SKURow (edit mode) — when row is being edited
              │     │     └── NewSKURow — when "+ Add SKU" clicked
              │     └── (empty state if no SKUs)
              └── CSVImportModal (hidden until triggered)
```

---

### State

```typescript
// In SKUCatalogPage

const [editingId, setEditingId] = useState<string | null>(null);
// null = no row being edited. Set to SKU id to put that row in edit mode.

const [showNewRow, setShowNewRow] = useState(false);
// true = show the blank inline-add row at bottom of table

const [newRowData, setNewRowData] = useState<Partial<SKU>>({});
// controlled state for the new row's form fields

const [showImportModal, setShowImportModal] = useState(false);

const [editRowData, setEditRowData] = useState<Partial<SKU>>({});
// controlled state for the row currently being edited
```

React Query for server data:
```typescript
const { data: skus, isLoading, refetch } = useQuery({
  queryKey: ['skus'],
  queryFn: () => fetch('/api/skus').then(r => r.json()).then(r => r.data),
});

const createMutation = useMutation({
  mutationFn: (sku: Partial<SKU>) => fetch('/api/skus', { method: 'POST', body: JSON.stringify(sku) }),
  onSuccess: () => { refetch(); setShowNewRow(false); setNewRowData({}); },
});

const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: Partial<SKU> }) =>
    fetch(`/api/skus/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  onSuccess: () => { refetch(); setEditingId(null); },
});

const deleteMutation = useMutation({
  mutationFn: (id: string) => fetch(`/api/skus/${id}`, { method: 'DELETE' }),
  onSuccess: () => refetch(),
});
```

---

### Table Columns

| Column | Type | Notes |
|--------|------|-------|
| Checkbox | UI only | Bulk select (future batch delete) |
| SKU ID | string | Auto-generated by server, format `SKU-NNN`. Not editable after creation. |
| Product Name | text input | Required. Max 100 chars. |
| Category | select dropdown | Required. Options: beverages, snacks, dairy, personal_care, household, other |
| Unit Cost (₹) | number input | Required. Stored in paise, displayed in ₹. Min ₹1. |
| Lead Time (days) | number input | Required. Integer 1–90. |
| Status | badge | Computed server-side. `active` = has ≥30 days sales history. `no_history` = SKU exists but no sales data uploaded yet. `inactive` = manually deactivated. |
| Actions | buttons | "Edit" → puts row in edit mode. "Delete" → opens confirm dialog. |

---

### Row Modes

**Read Mode (default):**
All cells display static text. Edit button visible.

**Edit Mode:**
All cells except SKU ID become input fields pre-filled with current values. Two buttons appear: "Save" (calls PUT) and "Cancel" (restores read mode without API call).

**New Row Mode:**
Blank input fields appended at the bottom of `tbody`. SKU ID cell shows auto-increment placeholder text (e.g. `SKU-013` as placeholder, actual ID assigned by server). "Save" calls POST. "Cancel" hides the row.

---

### Validation Rules (client-side, enforce before API call)

```typescript
const validateSKU = (data: Partial<SKU>): string[] => {
  const errors: string[] = [];
  if (!data.name?.trim()) errors.push('Product name is required');
  if (data.name && data.name.length > 100) errors.push('Name must be under 100 characters');
  if (!data.category) errors.push('Category is required');
  if (!data.unit_cost_paise || data.unit_cost_paise < 100) errors.push('Unit cost must be at least ₹1');
  if (!data.lead_time_days || data.lead_time_days < 1 || data.lead_time_days > 90) errors.push('Lead time must be 1–90 days');
  return errors;
};
```

Show errors inline below the row (not a toast) so the user can see which field failed.

---

### API Contracts

**GET /api/skus**
```
Response 200:
{
  "success": true,
  "data": {
    "skus": SKU[],
    "total": number
  }
}
```

**POST /api/skus**
```
Request body:
{
  "name": "Limca 500ml",
  "category": "beverages",
  "unit_cost_paise": 1800,
  "lead_time_days": 3
}

Response 201:
{
  "success": true,
  "data": SKU   ← includes server-assigned id, status, timestamps
}

Response 422 (validation error):
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "fields": { "name": "required" } }
}
```

**PUT /api/skus/[id]**
```
Request body: Partial<SKU> (only fields being changed)
Response 200: { "success": true, "data": SKU }
Response 404: { "success": false, "error": { "code": "SKU_NOT_FOUND" } }
```

**DELETE /api/skus/[id]**
```
Response 200: { "success": true }
Response 409 (conflict): { "success": false, "error": { "code": "HAS_FORECAST_DATA", "message": "Delete forecasts first" } }
```

---

### AWS Data Flow (Screen 1)

```
Next.js Route Handler (/api/skus)
  → HTTP POST to AWS API Gateway: POST /skus
    → Lambda: skus-handler
      → INSERT INTO rds.skus (name, category, unit_cost_paise, lead_time_days)
      → RETURNING id, status, created_at
    ← Lambda returns new SKU record
  ← API Gateway returns JSON
← Route Handler forwards to browser
```

The Lambda `skus-handler` connects to Amazon RDS (PostgreSQL) via the `pg` library using a connection string stored in AWS Secrets Manager. The Lambda runs in the same VPC as the RDS instance.

---

### CSV Import (SKU Catalog)

Clicking "Import CSV" opens a modal. The CSV must have these columns (header row required, order doesn't matter):

```
name, category, unit_cost, lead_time_days
```

The modal shows a drag-drop zone. On file select:
1. Client reads CSV with `papaparse` (no server call yet).
2. Preview table shows first 5 rows.
3. Client validates: checks required columns exist, checks data types, highlights bad rows in red.
4. If validation passes, user clicks "Import X SKUs."
5. POST to `/api/skus/bulk` with the parsed array.
6. Lambda does a batch `INSERT` into RDS, skips duplicates by name (upsert by name).
7. Response includes count of created vs skipped.

---

## 4. Screen 2 — Sales History Upload

### Route
`/setup/sales-history`

### Purpose
Upload historical sales data so SageMaker can train the forecasting model. This is a 4-step wizard: Upload → Map Columns → Validate → Confirm. Screens 2 and 3 cover steps 1 and 2. Steps 3 and 4 follow the same pattern and are specified briefly at the end of this section.

### What the user does
- Drag-drop or browse-select a CSV file
- See a preview of the first 5 rows
- Download a template CSV if they don't have one
- Generate synthetic demo data (hackathon shortcut)
- Proceed to column mapping

---

### Component Tree

```
app/setup/sales-history/page.tsx
  └── SetupLayout
        ├── SetupSidebar (active: "Sales History")
        └── SalesHistoryUploadPage
              ├── PageHeader
              ├── StepIndicator (steps: Upload, Map, Validate, Confirm; active: step 1)
              ├── UploadZone
              │     ├── Drag-drop area
              │     ├── Button: "Choose File"
              │     └── Hint text (required columns, max size)
              ├── TemplateSection
              │     ├── Button: "⬇ Download Template"
              │     └── Button: "Generate Synthetic Data (Demo)"
              ├── PreviewTable (shown only after file selected)
              │     └── First 5 rows of parsed CSV
              └── ActionRow
                    ├── (disabled initially, enabled after file selected)
                    └── Button: "Next: Map Columns →"
```

---

### State

```typescript
// In SalesHistoryUploadPage

const [file, setFile] = useState<File | null>(null);
const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
const [sessionId, setSessionId] = useState<string | null>(null);
// sessionId is set after the file is uploaded to S3 via presigned URL
// It's stored in sessionStorage so it survives the navigation to step 2
```

---

### Upload Flow (Detailed)

This is the most complex flow in the module. Follow these steps exactly.

**Step 1 — Client parses CSV locally (no server)**

When a file is selected (via drop or browse):
```typescript
import Papa from 'papaparse';

Papa.parse(file, {
  header: true,
  preview: 5,                // only parse first 5 rows for preview
  skipEmptyLines: true,
  complete: (results) => {
    setPreviewRows(results.data as Record<string, string>[]);
    setDetectedColumns(results.meta.fields ?? []);
  }
});
```

Show the preview table immediately from local parse. No server call yet.

**Step 2 — Get presigned S3 URL**

When user clicks "Next: Map Columns →":
```typescript
const presignRes = await fetch('/api/sales-history/upload', {
  method: 'POST',
  body: JSON.stringify({
    filename: file.name,
    file_size_bytes: file.size,
    detected_columns: detectedColumns,
  }),
});
const { data } = await presignRes.json();
// data = { session_id: "uuid", presigned_url: "https://s3.amazonaws.com/..." }
```

The route handler calls Lambda, which generates a presigned S3 PUT URL for the bucket `micropulse-data-lake` under key `raw-data/sales/{session_id}/{filename}`.

**Step 3 — Upload directly to S3 from browser**

```typescript
await fetch(data.presigned_url, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': 'text/csv' },
});
```

This is a direct browser-to-S3 upload using the presigned URL. The Next.js server never handles the file bytes.

**Step 4 — Store session, navigate**

```typescript
sessionStorage.setItem('upload_session', JSON.stringify({
  session_id: data.session_id,
  detected_columns: detectedColumns,
  original_filename: file.name,
}));
router.push('/setup/sales-history/map-columns');
```

---

### Template Download

The template CSV is stored as a static file in `/public/templates/sales_history_template.csv`. Clicking download triggers a simple `<a href="/templates/..." download>` link. No API call needed.

Template contents:
```
date,sku_id,pin_code,units_sold,unit_price
2024-01-01,SKU-001,395001,142,18
2024-01-01,SKU-002,395001,89,22
```

---

### Synthetic Data Generation

Clicking "Generate Synthetic Data (Demo)" calls:
```typescript
const res = await fetch('/api/sales-history/generate-synthetic', { method: 'POST' });
const { data } = await res.json();
// data = { session_id: "uuid", row_count: 5040, days: 180, skus: 12, pin_codes: 3 }
```

The Lambda function `generate-synthetic-data`:
1. Fetches all SKUs from RDS.
2. Fetches all PIN codes from RDS.
3. Generates 180 days × N SKUs × M PIN codes rows with random demand + contextual signals (weekends higher, IPL dates higher).
4. Writes the CSV directly to S3 under `raw-data/sales/{session_id}/synthetic.csv`.
5. Also creates a `session` record in RDS table `upload_sessions` with `status = 'uploaded'`.
6. Returns the session_id.

After success, store `session_id` in `sessionStorage` and navigate to `/setup/sales-history/map-columns`. The synthetic data is already mapped (known column names), so column mapping step is pre-filled and user can skip straight to confirm.

---

### API Contracts

**POST /api/sales-history/upload** (get presigned URL)
```
Request:
{
  "filename": "sales_jan_2024.csv",
  "file_size_bytes": 204800,
  "detected_columns": ["date", "sku_id", "pincode", "qty", "price"]
}

Response 200:
{
  "success": true,
  "data": {
    "session_id": "a1b2c3d4-...",
    "presigned_url": "https://micropulse-data-lake.s3.ap-south-1.amazonaws.com/..."
  }
}
```

**POST /api/sales-history/generate-synthetic**
```
Response 200:
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "row_count": 5040,
    "message": "Synthetic data generated for 12 SKUs × 3 PINs × 180 days"
  }
}
```

---

### AWS Data Flow (Screen 2)

```
Browser → Next.js Route Handler (/api/sales-history/upload)
  → API Gateway → Lambda: upload-session-handler
      → INSERT INTO rds.upload_sessions (session_id, original_filename, status='pending', detected_columns)
      → S3.createPresignedPost({ Bucket: 'micropulse-data-lake', Key: 'raw-data/sales/{session_id}/{filename}' })
    ← Returns { session_id, presigned_url }

Browser → S3 directly (presigned URL, PUT)
  → File lands in S3: raw-data/sales/{session_id}/filename.csv

(Later, after column mapping and confirm steps)
Browser → POST /api/sales-history/import
  → Lambda: import-sales-history
      → Read CSV from S3
      → Validate all rows
      → Bulk INSERT INTO rds.sales_history
      → UPDATE rds.upload_sessions SET status='imported'
      → UPDATE rds.skus SET status='active' for all SKUs in the file
```

---

## 5. Screen 3 — Column Mapping

### Route
`/setup/sales-history/map-columns`

### Purpose
The user's CSV may use different column names than MicroPulse expects. This screen lets them map their columns to the required fields. It auto-detects obvious matches.

### Guard: Redirect if no session

```typescript
// At top of page component
useEffect(() => {
  const session = sessionStorage.getItem('upload_session');
  if (!session) router.replace('/setup/sales-history');
}, []);
```

---

### Component Tree

```
app/setup/sales-history/map-columns/page.tsx
  └── SetupLayout
        ├── SetupSidebar (active: "Sales History")
        └── ColumnMappingPage
              ├── PageHeader
              ├── StepIndicator (active: step 2)
              ├── MappingTable
              │     └── MappingRow × 5 (date, sku_id, pin_code, units_sold, unit_price)
              └── ActionRow
                    ├── Button: "← Back"
                    └── Button: "Validate Data →" (disabled until required fields mapped)
```

---

### Auto-Detection Logic

On mount, read `detectedColumns` from `sessionStorage`. For each required field, auto-select the column that best matches using a simple keyword map:

```typescript
const AUTO_DETECT_MAP: Record<keyof ColumnMapping, string[]> = {
  date_col:       ['date', 'sale_date', 'txn_date', 'transaction_date', 'order_date'],
  sku_id_col:     ['sku_id', 'sku', 'product_id', 'item_id', 'article_id'],
  pin_code_col:   ['pin_code', 'pincode', 'pin', 'zip', 'postal_code'],
  units_sold_col: ['units_sold', 'quantity', 'qty', 'units', 'sales_qty', 'volume'],
  unit_price_col: ['unit_price', 'price', 'price_per_unit', 'mrp', 'selling_price'],
};

const autoDetect = (columns: string[]): ColumnMapping => {
  const result: Partial<ColumnMapping> = {};
  for (const [field, keywords] of Object.entries(AUTO_DETECT_MAP)) {
    const match = columns.find(col =>
      keywords.some(kw => col.toLowerCase().includes(kw))
    );
    if (match) result[field as keyof ColumnMapping] = match;
  }
  return result as ColumnMapping;
};
```

Show a subtle "auto-detected" indicator next to dropdowns that were matched automatically.

---

### State

```typescript
const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
const [availableColumns, setAvailableColumns] = useState<string[]>([]);
const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
// sampleValues: column name → first non-header value from CSV preview

useEffect(() => {
  const session = JSON.parse(sessionStorage.getItem('upload_session') || '{}');
  setAvailableColumns(session.detected_columns ?? []);
  // auto-detect on load
  setMapping(autoDetect(session.detected_columns ?? []));
}, []);
```

---

### Mapping Table Structure

Each row in the mapping table has:

| Column | Content |
|--------|---------|
| MicroPulse Field | Static label: e.g. "Date" |
| Required? | Badge: "Required" (red) or "Optional" |
| Your CSV Column | `<select>` dropdown listing all detected column names. Has an extra "— skip —" option for optional fields. |
| Sample Value | The first data value from the preview for the selected column. Updates live as dropdown changes. |
| Status | ✓ (green) if mapped, ⚠ if required and not mapped |

---

### Validation Before Proceeding

```typescript
const canProceed = (): boolean => {
  return !!(mapping.date_col && mapping.sku_id_col && mapping.pin_code_col && mapping.units_sold_col);
  // unit_price_col is optional
};
```

When user clicks "Validate Data →":
1. Save the mapping to `sessionStorage`:
   ```typescript
   const session = JSON.parse(sessionStorage.getItem('upload_session')!);
   session.column_mapping = mapping;
   sessionStorage.setItem('upload_session', JSON.stringify(session));
   ```
2. POST mapping to server to persist:
   ```typescript
   await fetch('/api/sales-history/map-columns', {
     method: 'POST',
     body: JSON.stringify({ session_id, mapping }),
   });
   ```
3. Navigate to `/setup/sales-history/validate`.

---

### API Contract

**POST /api/sales-history/map-columns**
```
Request:
{
  "session_id": "uuid",
  "mapping": {
    "date_col": "date",
    "sku_id_col": "sku_id",
    "pin_code_col": "pin_code",
    "units_sold_col": "units_sold",
    "unit_price_col": "price_per_unit"
  }
}

Response 200:
{
  "success": true,
  "data": { "session_id": "uuid", "status": "mapped" }
}
```

The Lambda updates `rds.upload_sessions SET status='mapped', column_mapping='{...}'` for this session.

---

### Steps 3 & 4 Brief Spec

**Step 3 — Validate** (`/setup/sales-history/validate`)
Lambda reads the S3 CSV, applies the column mapping, and validates every row. Returns a validation report:
```json
{
  "total_rows": 5040,
  "valid_rows": 5038,
  "invalid_rows": 2,
  "errors": [
    { "row": 412, "column": "date", "value": "32/01/2024", "issue": "Invalid date format" },
    { "row": 1893, "column": "units_sold", "value": "abc", "issue": "Not a number" }
  ]
}
```
Show a summary. If invalid rows < 1% of total, allow proceeding. Otherwise block and ask user to fix CSV.

**Step 4 — Confirm** (`/setup/sales-history/confirm`)
Shows final summary: date range, SKU count, PIN count, total rows. User clicks "Import." Lambda runs the bulk INSERT into `rds.sales_history`. On success, navigate to readiness check screen.

---

## 6. Screen 4 — Current Inventory Input

### Route
`/setup/inventory`

### Purpose
Define current stock levels for each SKU at each PIN code. This is the **critical input** for the simulation engine: Lambda uses `stock_on_hand`, `reorder_point`, and the SageMaker forecast to calculate stockout probability and working capital impact.

---

### Component Tree

```
app/setup/inventory/page.tsx
  └── SetupLayout
        ├── SetupSidebar (active: "Inventory")
        └── InventoryPage
              ├── PageHeader
              ├── FilterRow
              │     ├── Select: PIN filter
              │     └── Select: Category filter
              ├── ActionRow
              │     ├── Button: "Import CSV"
              │     └── Button: "Save All" (disabled if no changes)
              ├── InventoryTable
              │     ├── thead (6 columns)
              │     └── tbody: InventoryRow × N (inline-editable cells)
              ├── UnsavedChangesBar (sticky bottom, shown when dirty)
              └── CSVImportModal
```

---

### State

```typescript
// In InventoryPage

const [filters, setFilters] = useState({ pin_code: 'all', category: 'all' });

// The "working copy" of inventory data that the user is editing
const [localInventory, setLocalInventory] = useState<InventoryRecord[]>([]);

// Track which rows have unsaved edits — key: "{sku_id}:{pin_code}"
const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());

const isDirty = dirtyRows.size > 0;
```

React Query:
```typescript
const { data: inventoryData, refetch } = useQuery({
  queryKey: ['inventory', filters],
  queryFn: () => fetch(`/api/inventory?pin=${filters.pin_code}&category=${filters.category}`)
    .then(r => r.json()).then(r => r.data.records),
  onSuccess: (data) => {
    setLocalInventory(data);
    setDirtyRows(new Set()); // clear dirty on fresh load
  }
});

const bulkUpdateMutation = useMutation({
  mutationFn: (records: InventoryRecord[]) =>
    fetch('/api/inventory', {
      method: 'PUT',
      body: JSON.stringify({ records }),
    }),
  onSuccess: () => {
    refetch();
    setDirtyRows(new Set());
  },
});
```

---

### Inline Cell Editing

Each cell in the `stock_on_hand` and `reorder_point` columns is an `<input type="number">`. The user edits directly in the table — no "edit mode" toggle needed.

```typescript
const handleCellChange = (
  skuId: string,
  pinCode: string,
  field: 'stock_on_hand' | 'reorder_point',
  value: string
) => {
  const key = `${skuId}:${pinCode}`;
  setDirtyRows(prev => new Set(prev).add(key));
  setLocalInventory(prev =>
    prev.map(row =>
      row.sku_id === skuId && row.pin_code === pinCode
        ? { ...row, [field]: parseInt(value) || 0 }
        : row
    )
  );
};
```

---

### Status Computation

`InventoryStatus` is computed client-side from the local data (not stored in DB):

```typescript
const getInventoryStatus = (record: InventoryRecord): InventoryStatus => {
  const ratio = record.stock_on_hand / record.reorder_point;
  if (ratio >= 1.5) return 'healthy';
  if (ratio >= 0.8) return 'low';
  return 'critical';
};
```

Status badge colors:
- `healthy` → green background
- `low` → amber background
- `critical` → red background

---

### Save All Behavior

Clicking "Save All" (or the "Save Changes" button in the sticky unsaved-changes bar) sends only the dirty rows:

```typescript
const handleSaveAll = () => {
  const dirtyRecords = localInventory.filter(row =>
    dirtyRows.has(`${row.sku_id}:${row.pin_code}`)
  );
  bulkUpdateMutation.mutate(dirtyRecords);
};
```

**Unsaved Changes Bar:** A sticky bar at the bottom of the viewport appears whenever `isDirty === true`. It shows "X unsaved changes" and has "Save Changes" and "Discard" buttons. This prevents accidental data loss on navigation.

```typescript
// Warn on navigation if dirty
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) e.preventDefault();
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

---

### Table Columns

| Column | Description |
|--------|-------------|
| SKU ID | Static, not editable |
| Product Name | Static |
| PIN Code | Static |
| Stock on Hand | `<input type="number" min="0">` — units currently in stock |
| Reorder Point | `<input type="number" min="0">` — threshold below which a reorder should trigger |
| Status | Computed badge (healthy/low/critical) based on stock_on_hand vs reorder_point ratio |

---

### Filter Behavior

When the user changes the PIN or category filter:
1. `filters` state updates.
2. React Query re-fetches with new query params.
3. `localInventory` resets to fresh data.
4. `dirtyRows` clears.
5. If `isDirty` at the time of filter change, show a confirmation dialog: "You have unsaved changes. Save before switching filters?" with Save / Discard / Cancel options.

---

### API Contracts

**GET /api/inventory**
```
Query params: ?pin=all&category=beverages
Response 200:
{
  "success": true,
  "data": {
    "records": InventoryRecord[],
    "total": number
  }
}
```

Lambda queries:
```sql
SELECT i.*, s.name, s.category
FROM inventory i
JOIN skus s ON i.sku_id = s.id
WHERE ($1 = 'all' OR i.pin_code = $1)
  AND ($2 = 'all' OR s.category = $2)
ORDER BY s.category, s.name, i.pin_code;
```

**PUT /api/inventory** (bulk update)
```
Request:
{
  "records": [
    { "sku_id": "SKU-001", "pin_code": "395001", "stock_on_hand": 340, "reorder_point": 100 },
    ...
  ]
}

Response 200:
{
  "success": true,
  "data": { "updated_count": 4 }
}
```

Lambda does an upsert:
```sql
INSERT INTO inventory (sku_id, pin_code, stock_on_hand, reorder_point, last_updated)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (sku_id, pin_code)
DO UPDATE SET
  stock_on_hand = EXCLUDED.stock_on_hand,
  reorder_point = EXCLUDED.reorder_point,
  last_updated = NOW();
```

---

### CSV Import (Inventory)

Same modal pattern as SKU CSV import. Required columns:

```
sku_id, pin_code, stock_on_hand, reorder_point
```

Parsed client-side with papaparse, validated, then POST to `/api/inventory/import`. Lambda does bulk upsert.

---

### AWS Data Flow (Screen 4)

```
Browser → Next.js Route Handler (PUT /api/inventory)
  → API Gateway → Lambda: inventory-handler
      → Bulk upsert into rds.inventory
      → Returns updated_count
← Route Handler → Browser
```

No S3 involvement for inventory. All data goes directly to RDS.

---

## 7. Screen 5 — Stores & PIN Code Setup + Readiness Check

### Route
`/setup/pin-codes`

### Purpose
Two things happen on this screen: (1) Register the geographic zones (PIN codes) MicroPulse will forecast, and (2) show a readiness checklist that gatekeeps the "Run Forecast" action. The forecast cannot be triggered until all 4 data inputs (SKUs, sales history, inventory, PIN codes) are complete.

---

### Component Tree

```
app/setup/pin-codes/page.tsx
  └── SetupLayout
        ├── SetupSidebar (active: "Stores / PIN Codes")
        └── PINCodesPage
              ├── PageHeader
              ├── PINCodesSection
              │     ├── ActionRow
              │     │     ├── Button: "+ Add PIN Code"
              │     │     └── Text: "{count} active zones"
              │     ├── PINCodesTable
              │     │     ├── thead
              │     │     ├── tbody: PINRow (read) × N
              │     │     └── NewPINRow (inline add)
              │     └── (empty state)
              ├── Divider
              └── ReadinessSection
                    ├── SectionHeader: "Data Readiness Check"
                    ├── ReadinessTable
                    │     └── ReadinessRow × 4 (SKUs, Sales, Inventory, PINs)
                    └── ActionRow
                          └── Button: "Run Forecast Model →" (disabled unless all_clear)
```

---

### State

```typescript
const [showNewRow, setShowNewRow] = useState(false);
const [newPIN, setNewPIN] = useState<Partial<PINCode>>({});
const [editingPIN, setEditingPIN] = useState<string | null>(null);
const [editPINData, setEditPINData] = useState<Partial<PINCode>>({});
```

React Query:
```typescript
const { data: pinCodes, refetch: refetchPINs } = useQuery({
  queryKey: ['pin-codes'],
  queryFn: () => fetch('/api/pin-codes').then(r => r.json()).then(r => r.data.pin_codes),
});

const { data: readiness, refetch: refetchReadiness } = useQuery({
  queryKey: ['readiness'],
  queryFn: () => fetch('/api/readiness').then(r => r.json()).then(r => r.data),
  // Poll every 10 seconds so it updates after background jobs complete
  refetchInterval: 10000,
});

const createPINMutation = useMutation({ ... });
const updatePINMutation = useMutation({ ... });
const deletePINMutation = useMutation({ ... });
```

---

### PIN Code Table Columns

| Column | Description |
|--------|-------------|
| PIN Code | 6-digit string, editable on creation only |
| City / Area Name | Free text, e.g. "Surat — Adajan" |
| Region | Dropdown: Gujarat, Maharashtra, Rajasthan, Tamil Nadu, Karnataka, Other |
| Store Count | Integer — how many retail outlets in this zone |
| Status | Badge: Active / Inactive |
| Actions | Edit / Delete buttons |

---

### PIN Code Validation

```typescript
const validatePINCode = (data: Partial<PINCode>): string[] => {
  const errors: string[] = [];
  if (!data.pin_code?.match(/^\d{6}$/)) errors.push('PIN code must be exactly 6 digits');
  if (!data.area_name?.trim()) errors.push('Area name is required');
  if (!data.region) errors.push('Region is required');
  if (data.store_count !== undefined && data.store_count < 0) errors.push('Store count cannot be negative');
  return errors;
};
```

---

### Readiness Check Section

This section is always visible at the bottom of the page, separated by a divider.

**ReadinessRow structure:**

| Input | Status | Action |
|-------|--------|--------|
| SKU Catalog | ✓ 12 SKUs (green) | "Ready" text |
| Sales History | ✓ 180 days (green) | "Ready" text |
| Current Inventory | ⚠ 2 SKUs missing data (amber) | "Fill Now" button → navigates to /setup/inventory |
| PIN Codes | ✓ 3 zones (green) | "Ready" text |

**Status logic (derived from `ReadinessCheck` API response):**

```typescript
const getSKUStatus = (r: ReadinessCheck) =>
  r.skus.count >= 1 ? { ok: true, label: `✓ ${r.skus.count} SKUs` } : { ok: false, label: 'No SKUs added' };

const getSalesStatus = (r: ReadinessCheck) =>
  r.sales_history.days_of_data >= 30
    ? { ok: true, label: `✓ ${r.sales_history.days_of_data} days` }
    : { ok: false, label: `Only ${r.sales_history.days_of_data} days (need 30+)` };

const getInventoryStatus = (r: ReadinessCheck) =>
  r.inventory.missing_count === 0
    ? { ok: true, label: '✓ All inventory set' }
    : { ok: 'warn', label: `⚠ ${r.inventory.missing_count} SKUs missing data` };

const getPINStatus = (r: ReadinessCheck) =>
  r.pin_codes.count >= 1 ? { ok: true, label: `✓ ${r.pin_codes.count} zones` } : { ok: false, label: 'No PIN codes added' };
```

---

### Run Forecast Button

This button is the **exit point from the setup module**. It initiates the ML pipeline.

```typescript
<button
  onClick={handleRunForecast}
  disabled={!readiness?.all_clear}
  className={readiness?.all_clear ? 'btn-primary' : 'btn-disabled'}
>
  Run Forecast Model →
</button>
```

When clicked (`all_clear === true`):
```typescript
const handleRunForecast = async () => {
  // 1. POST to trigger the SageMaker inference pipeline
  const res = await fetch('/api/forecast/trigger', { method: 'POST' });
  const { data } = await res.json();
  // data = { job_id: "uuid", estimated_seconds: 120 }

  // 2. Navigate to the forecasts page with the job ID
  router.push(`/forecasts?job_id=${data.job_id}`);
};
```

The `/api/forecast/trigger` Lambda:
1. Calls SageMaker endpoint with batch inference request.
2. Stores the job record in `rds.forecast_jobs`.
3. Returns `job_id`.

The forecast page polls `/api/forecast/status?job_id=...` until complete.

---

### API Contracts

**GET /api/pin-codes**
```
Response 200:
{
  "success": true,
  "data": { "pin_codes": PINCode[] }
}
```

**POST /api/pin-codes**
```
Request: Partial<PINCode>
Response 201: { "success": true, "data": PINCode }
Response 409 (duplicate): { "success": false, "error": { "code": "PIN_EXISTS" } }
```

**DELETE /api/pin-codes/[pin]**
```
Response 200: { "success": true }
Response 409: { "success": false, "error": { "code": "HAS_INVENTORY_DATA", "message": "Remove inventory data for this PIN first" } }
```

**GET /api/readiness**
```
Response 200:
{
  "success": true,
  "data": {
    "skus": { "ok": true, "count": 12 },
    "sales_history": { "ok": true, "days_of_data": 180 },
    "inventory": { "ok": false, "missing_count": 2 },
    "pin_codes": { "ok": true, "count": 3 },
    "all_clear": false
  }
}
```

Lambda SQL for readiness:
```sql
SELECT
  (SELECT COUNT(*) FROM skus WHERE status = 'active') AS sku_count,
  (SELECT COUNT(DISTINCT date::date) FROM sales_history) AS days_of_data,
  (
    SELECT COUNT(*) FROM skus s
    WHERE NOT EXISTS (
      SELECT 1 FROM inventory i WHERE i.sku_id = s.id
    )
  ) AS missing_inventory_count,
  (SELECT COUNT(*) FROM pin_codes WHERE status = 'active') AS pin_count;
```

---

## 8. Shared Layout: Sidebar Navigation

### File: `app/setup/layout.tsx`

This wraps all 5 screens with the top navigation bar and the left sidebar.

```typescript
// app/setup/layout.tsx
export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="setup-layout">
      <TopNav activeSection="Data Setup" />
      <div className="layout-body">
        <SetupSidebar />
        <main className="layout-main">{children}</main>
      </div>
    </div>
  );
}
```

### Top Nav Items (always visible)

- **MicroPulse** (logo/brand, left-aligned)
- Data Setup (active when on any `/setup/*` route)
- Forecasts → `/forecasts`
- Dashboard → `/dashboard`
- AI Chat → `/chat`

### Sidebar Items

```typescript
const SIDEBAR_ITEMS = [
  {
    section: 'Data Setup',
    items: [
      { label: 'SKU Catalog',       href: '/setup/skus' },
      { label: 'Inventory',         href: '/setup/inventory' },
      { label: 'Sales History',     href: '/setup/sales-history' },
      { label: 'Stores / PIN Codes',href: '/setup/pin-codes' },
    ]
  }
];
```

Active item is determined by `usePathname()` matching `href`.

---

## 9. API Reference Summary

| Method | Path | Screen | Action |
|--------|------|--------|--------|
| GET | /api/skus | 1 | List all SKUs |
| POST | /api/skus | 1 | Create SKU |
| PUT | /api/skus/[id] | 1 | Update SKU |
| DELETE | /api/skus/[id] | 1 | Delete SKU |
| POST | /api/skus/bulk | 1 | Bulk import SKUs from CSV |
| POST | /api/sales-history/upload | 2 | Get S3 presigned URL |
| POST | /api/sales-history/generate-synthetic | 2 | Generate demo data |
| POST | /api/sales-history/map-columns | 3 | Save column mapping |
| POST | /api/sales-history/validate | 3→ | Trigger validation Lambda |
| POST | /api/sales-history/import | → 4 | Trigger bulk import Lambda |
| GET | /api/inventory | 4 | List inventory (filterable) |
| PUT | /api/inventory | 4 | Bulk upsert inventory records |
| POST | /api/inventory/import | 4 | Import inventory from CSV |
| GET | /api/pin-codes | 5 | List PIN codes |
| POST | /api/pin-codes | 5 | Create PIN code |
| PUT | /api/pin-codes/[pin] | 5 | Update PIN code |
| DELETE | /api/pin-codes/[pin] | 5 | Delete PIN code |
| GET | /api/readiness | 5 | Data readiness check |
| POST | /api/forecast/trigger | 5 | Trigger SageMaker inference |

---

## 10. AWS Data Flow Diagram (Text)

```
┌──────────────────────────────────────────────────────────────┐
│                     BROWSER (Next.js)                        │
│  /setup/skus  /setup/inventory  /setup/sales-history  etc.  │
└──────────────────┬───────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────────────────────┐
│              NEXT.JS SERVER (Route Handlers)                 │
│              app/api/**                                       │
│              Runs on: AWS Amplify / Vercel                   │
└──────────┬──────────────────────────────────────────────────┘
           │ HTTPS
           ▼
┌──────────────────────────────────────────────────────────────┐
│              AMAZON API GATEWAY                               │
│              Base URL: https://xxxxx.execute-api.ap-south-1. │
│              Auth: API Key in x-api-key header               │
└──────────┬──────────────────────────────────────────────────┘
           │ Lambda Proxy Integration
           ▼
┌──────────────────────────────────────────────────────────────┐
│              AWS LAMBDA FUNCTIONS                             │
│                                                               │
│  skus-handler           → CRUD on rds.skus                   │
│  inventory-handler      → CRUD on rds.inventory              │
│  pin-codes-handler      → CRUD on rds.pin_codes              │
│  upload-session-handler → rds.upload_sessions + S3 presign   │
│  import-sales-handler   → S3 read → rds.sales_history        │
│  generate-synthetic     → S3 write + rds.upload_sessions     │
│  readiness-handler      → Multi-table query on RDS           │
│                                                               │
│  All Lambdas: Node.js 20.x, VPC subnet matching RDS          │
└──────┬───────────────────────────────────────────────────────┘
       │ Connection pool via pg library
       │ Credentials from AWS Secrets Manager
       ▼
┌──────────────────────────────────────────────────────────────┐
│              AMAZON RDS (PostgreSQL 15)                       │
│              Instance: db.t3.micro (hackathon)                │
│              Tables: skus, pin_codes, inventory,              │
│                      sales_history, upload_sessions,          │
│                      forecast_jobs, forecasts,                │
│                      recommendations                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              AMAZON S3 (micropulse-data-lake)                 │
│                                                               │
│  /raw-data/sales/{session_id}/*.csv   ← uploaded CSVs        │
│  /processed-data/                     ← cleaned data         │
│  /models/                             ← SageMaker artifacts  │
│  /forecasts/                          ← model outputs        │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Error Handling Strategy

### API Errors (4xx / 5xx)

All API errors from AWS return the envelope format:
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable" } }
```

In Next.js route handlers, always check `response.ok` and throw if false:
```typescript
const res = await fetch(AWS_API_URL, { ... });
if (!res.ok) {
  const err = await res.json();
  return NextResponse.json(err, { status: res.status });
}
```

### Client-Side Error Display

- **Form validation errors:** Shown inline under the relevant field. Red text, no toast.
- **Network errors (POST/PUT/DELETE):** Show a toast notification (top-right, red background). Include a "Retry" button.
- **Loading states:** Every table shows a skeleton loader while data is fetching (3 grey rows pulsing).
- **Empty states:** When a table has 0 rows, show an `EmptyState` component with an icon and call-to-action button.

### Optimistic Updates

For row edits and deletes, use React Query's `onMutate` / `onError` / `onSettled` pattern to apply updates optimistically and roll back on failure. This keeps the UI feeling fast.

```typescript
const updateMutation = useMutation({
  mutationFn: updateSKU,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['skus'] });
    const previous = queryClient.getQueryData(['skus']);
    queryClient.setQueryData(['skus'], (old: SKU[]) =>
      old.map(s => s.id === variables.id ? { ...s, ...variables.data } : s)
    );
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['skus'], context?.previous);
    toast.error('Failed to update SKU. Changes reverted.');
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['skus'] }),
});
```

---

## 12. Environment Variables

Required in `.env.local` (never commit this file):

```env
# AWS API Gateway
NEXT_PUBLIC_API_BASE_URL=https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod
API_GATEWAY_KEY=your-api-key-here

# AWS Region
AWS_REGION=ap-south-1

# Used only if you call AWS SDK directly from Route Handlers (not recommended; prefer Lambda)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

In production (AWS Amplify), set these as environment variables in the Amplify console. Never expose `API_GATEWAY_KEY` to the browser — it is only used in Next.js Route Handlers (server-side).

---

*End of specification. Last updated: MicroPulse Hackathon Sprint.*