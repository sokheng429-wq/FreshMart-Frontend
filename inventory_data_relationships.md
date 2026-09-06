# Inventory & Stock System: Data Relationship & Architecture Guide

This document explains the complete **Data Model, Entity Relationships, Database Schema, and Transaction Lifecycles** powering the B'Groceries Inventory & Stock Management System across the Spring Boot backend and React frontend.

---

## 1. High-Level Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    PRODUCT_GROUP ||--o{ PRODUCT : "classifies"
    CATEGORY ||--o{ PRODUCT : "categorizes"
    BRAND ||--o{ PRODUCT : "brands"
    UNIT_OF_MEASURE ||--o{ PRODUCT : "measures (UOM)"
    SUPPLIER ||--o{ PRODUCT : "supplies"
    
    PRODUCT ||--o{ STOCK_LINE : "referenced in stock movements"
    STOCK_DOCUMENT ||--|{ STOCK_LINE : "contains lines (1 to many)"
    USER ||--o{ STOCK_DOCUMENT : "creates / audits"
    
    PRODUCT ||--o{ TRANSFER_LINE : "referenced in transfers"
    TRANSFER_DOCUMENT ||--|{ TRANSFER_LINE : "contains lines (1 to many)"
    USER ||--o{ TRANSFER_DOCUMENT : "submits / dispatches"
```

---

## 2. Core Entities & Schema Details

### 2.1 Master Data Layer (Catalog & Attributes)

```mermaid
classDiagram
    class Product {
        +Long id (PK)
        +String code (Unique)
        +String barCode (Unique)
        +String name
        +String nameKh
        +BigDecimal onHand
        +BigDecimal basePrice
        +BigDecimal averageCost
        +BigDecimal standardCost
        +String uom
        +String serial
        +String imageUrl
        +Boolean status
    }

    class Category {
        +Long id (PK)
        +String name
        +String code
    }

    class Brand {
        +Long id (PK)
        +String name
        +String code
    }

    class UnitOfMeasure {
        +Long id (PK)
        +String code
        +String description
    }

    class Supplier {
        +Long id (PK)
        +String name
        +String code
        +String contactPerson
        +String phone
        +String email
    }

    Product --> Category : belongs to
    Product --> Brand : manufactured by
    Product --> UnitOfMeasure : measured in
    Product --> Supplier : primary vendor
```

- **`Product` (`product` table)**: The central catalog entity. Every stock quantity (`onHand`), selling price (`basePrice`), and cost basis (`averageCost`) lives here.
- **`UnitOfMeasure` (`unit_of_measure` table)**: Defines inventory units (`Kg`, `Pcs`, `Pack`, `Bottle`, `Box`).
- **`Supplier` (`supplier` table)**: Links products with commercial vendors for replenishment and PO tracking.

---

### 2.2 Stock Transaction Layer (Receive, Issue, Adjust)

```mermaid
classDiagram
    class StockDocument {
        +Long id (PK)
        +String code (e.g. GRN-0001, GI-0002)
        +DocType docType (RECEIVE / ISSUE / ADJUST)
        +LocalDate date
        +String supplier
        +String receiveType
        +String reference
        +String receivedBy
        +String locationKey
        +BigDecimal totalCost
        +String status
        +String note
        +LocalDateTime createdAt
    }

    class StockLine {
        +Long id (PK)
        +Long documentId (FK -> StockDocument)
        +Long productId (FK -> Product)
        +String nameSnapshot
        +BigDecimal qty (Receive / Issue)
        +BigDecimal countedQty (Adjust only)
        +BigDecimal qtyBefore
        +BigDecimal qtyAfter
        +BigDecimal unitCost
        +BigDecimal lineTotal
        +String serials
    }

    StockDocument "1" *-- "many" StockLine : cascades ALL
    StockLine --> Product : FK joins
```

#### How the Relationships Work:
1. **Document-Line Composition (`1:N`)**: A `StockDocument` owns multiple `StockLine` items. Deleting a document automatically cascades and removes its lines.
2. **Audit Snapshots**:
   - `nameSnapshot`: Retains the product name as it was on the document date, even if the product is later renamed.
   - `qtyBefore` & `qtyAfter`: Captures the exact inventory balance before and after the transaction for auditable history.
3. **Foreign Key Integrity**: Every line holds a physical `@ManyToOne` foreign key to `Product`. This guarantees that on-hand counts and ledgers never get out of sync.

---

### 2.3 Stock Transfer & Logistics Layer

```mermaid
classDiagram
    class TransferDocument {
        +Long id (PK)
        +String code (e.g. TR-260827-0001, TF-260827-0001)
        +DocType docType (REQUEST / TRANSFER)
        +LocalDate transferDate
        +LocalDate requiredDate
        +LocalDate requestTransferDate
        +String fromOutlet
        +String fromLocation
        +String toOutlet
        +String toLocation
        +String transferType
        +String reference
        +String templateName
        +String status (PENDING / IN-TRANSIT / RECEIVED / COMPLETED)
        +String carrier
        +String trackingNumber
        +String dispatchNote
        +String userName
        +BigDecimal totalQty
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    class TransferLine {
        +Long id (PK)
        +Long transferDocumentId (FK -> TransferDocument)
        +Long productId (FK -> Product)
        +String code
        +String barCode
        +String name
        +String nameKh
        +String uom
        +BigDecimal onHand
        +BigDecimal qty
        +BigDecimal unitCost
        +BigDecimal lineTotal
    }

    TransferDocument "1" *-- "many" TransferLine : cascades ALL
    TransferLine --> Product : FK joins
```

---

## 3. Stock Movement & Cost Calculation Mechanics

### 3.1 Goods Receipt (`DocType.RECEIVE`)
When receiving new inventory from suppliers:
1. **On-Hand Increase**:
   $$\text{onHand}_{\text{new}} = \text{onHand}_{\text{old}} + \text{qty}_{\text{received}}$$
2. **Moving Average Cost (MAC) Formula**:
   $$\text{averageCost}_{\text{new}} = \frac{(\text{onHand}_{\text{old}} \times \text{averageCost}_{\text{old}}) + (\text{qty}_{\text{received}} \times \text{unitCost}_{\text{received}})}{\text{onHand}_{\text{old}} + \text{qty}_{\text{received}}}$$

### 3.2 Goods Issue (`DocType.ISSUE`)
When issuing stock for internal consumption, samples, or write-offs:
1. **On-Hand Deduction**:
   $$\text{onHand}_{\text{new}} = \text{onHand}_{\text{old}} - \text{qty}_{\text{issued}}$$
2. Cost basis remains unchanged (`averageCost` is preserved).

### 3.3 Inventory Adjustment (`DocType.ADJUST`)
When physical inventory counts differ from system quantities:
1. **Reconciliation**:
   $$\text{onHand}_{\text{new}} = \text{countedQty}$$
   $$\text{diff} = \text{countedQty} - \text{onHand}_{\text{old}}$$

### 3.4 Document Reversal on Delete
If a `StockDocument` is deleted via `DELETE /api/admin/stock-documents/{id}`:
- `RECEIVE` documents automatically deduct the received quantities.
- `ISSUE` documents automatically restore the issued quantities.
- `ADJUST` documents revert `onHand` back to `qtyBefore`.

---

## 4. Stock Transfer Lifecycle Workflow

```mermaid
sequenceDiagram
    autonumber
    actor RequestingBranch as Requesting Branch (Outlet)
    actor FulfillmentHub as Warehouse / Fulfillment Hub
    participant FE as React Frontend
    participant API as Spring Boot API
    participant DB as PostgreSQL Database

    Note over RequestingBranch,DB: Step 1: Submit Stock Request
    RequestingBranch->>FE: Fill Request Transfer form (From Outlet -> To Outlet)
    FE->>API: POST /api/admin/transfers (docType=REQUEST, status=PENDING)
    API->>DB: Save TransferDocument & TransferLine (TR-YYMMDD-XXXX)
    
    Note over FulfillmentHub,DB: Step 2: Picking & Dispatch
    FulfillmentHub->>FE: Open "Ship & Request Transfer"
    FE->>API: GET /api/admin/transfers?status=PENDING
    API-->>FE: Return pending requests
    FulfillmentHub->>FE: Assign Carrier & Tracking -> Click "Dispatch Shipment"
    FE->>API: PUT /api/admin/transfers/{id}/status (status=IN-TRANSIT, carrier, tracking)
    API->>DB: Update status to IN-TRANSIT
    
    Note over RequestingBranch,DB: Step 3: Destination Receiving
    RequestingBranch->>FE: Receive physical shipment -> Click "Confirm Receipt"
    FE->>API: PUT /api/admin/transfers/{id}/status (status=RECEIVED)
    API->>DB: Update status to RECEIVED
```

---

## 5. Frontend Pages to Backend REST APIs Mapping

| Frontend Page / Component | Action | Backend REST Endpoint | Database Entity |
| :--- | :--- | :--- | :--- |
| **All Products** (`StocksList.jsx`) | View Catalog | `GET /api/admin/products` | `Product` |
| **Receive Products** (`ReceiveProductsCreate.jsx`) | Post Receipt | `POST /api/admin/stock-documents` | `StockDocument` + `StockLine` |
| **Receive Products List** (`TransactionSection.jsx`) | View & Export Ledgers | `GET /api/admin/stock-documents?docType=RECEIVE` | `StockDocument` |
| **Issue Products** (`TransactionDocCreate.jsx`) | Deduct Stock | `POST /api/admin/stock-documents` | `StockDocument` + `StockLine` |
| **Adjustment Products** (`TransactionDocCreate.jsx`) | Reconcile Counts | `POST /api/admin/stock-documents` | `StockDocument` + `StockLine` |
| **Request Transfer** (`RequestTransferCreate.jsx`) | Create Request | `POST /api/admin/transfers` | `TransferDocument` + `TransferLine` |
| **Request Transfer List** (`RequestTransferSection.jsx`) | Filter & Delete | `GET /api/admin/transfers?docType=REQUEST` | `TransferDocument` |
| **Ship & Request Transfer** (`ShipRequestTransferSection.jsx`) | Dispatch / Bulk Ship | `PUT /api/admin/transfers/{id}/status`<br>`POST /api/admin/transfers/ship-bulk` | `TransferDocument` |
| **Transfer Products** (`TransferProductsCreate.jsx`) | Direct Transfer | `POST /api/admin/transfers` | `TransferDocument` + `TransferLine` |
| **Products Prices** (`ToolsSection.jsx`) | Update Selling Prices | `PUT /api/admin/products/{id}` | `Product` (`basePrice`) |
| **Cost Change** (`ToolsSection.jsx`) | Batch Cost Adjustments | `PUT /api/admin/products/{id}` | `Product` (`averageCost`) |
| **Products Supplier** (`ToolsSection.jsx`) | Map Vendors | `PUT /api/admin/products/{id}` | `Product` (`supplier`) |
| **Master Data** (`MasterDataSection.jsx`) | Manage Categories, Brands, UOMs | `GET/POST/PUT/DELETE /api/admin/{categories,brands,units}` | `Category`, `Brand`, `UnitOfMeasure` |
