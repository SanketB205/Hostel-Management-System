# Finance Service Documentation

## Overview
Centralized service for calculating student financial summaries in the Hostel Management System.

**File:** `backend/src/services/finance.service.js`  
**Type:** READ-ONLY calculation service  
**Created:** Step 1 of Payment System Refactoring

---

## Purpose

This service provides a **single source of truth** for calculating a student's financial summary based on:
- `Student.totalBillable` (primary billing amount)
- Successful `Payment` records (where `status = 'Success'`)

---

## API

### `getStudentFinancialSummary(studentId)`

Calculates and returns a student's complete financial summary.

#### Parameters
- `studentId` (string) - UUID of the student

#### Returns
Promise resolving to:
```javascript
{
  totalBillable: number,  // Total amount the student owes
  totalPaid: number,      // Total amount successfully paid
  balanceDue: number,     // Remaining balance (never negative)
  paymentStatus: string   // "Pending" | "Partial" | "Paid"
}
```

#### Throws
- `Error` - if student not found

#### Example Usage
```javascript
import { getStudentFinancialSummary } from './services/finance.service.js';

try {
  const summary = await getStudentFinancialSummary('student-uuid-here');
  console.log(summary);
  // {
  //   totalBillable: 50000,
  //   totalPaid: 20000,
  //   balanceDue: 30000,
  //   paymentStatus: "Partial"
  // }
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## Calculation Logic

### 1. Total Billable
```javascript
totalBillable = parseFloat(Student.totalBillable || 0)
```
- Source: `Student.totalBillable` field
- Safe conversion from DECIMAL to number
- Defaults to 0 if null/undefined

### 2. Total Paid
```javascript
totalPaid = sum of Payment.amount where Payment.status = 'Success'
```
- **ONLY** counts successful payments
- Failed and Pending payments are **EXCLUDED**
- Safe conversion from DECIMAL to number
- Returns 0 if no successful payments

### 3. Balance Due
```javascript
balanceDue = Math.max(0, totalBillable - totalPaid)
```
- Calculated value: `totalBillable - totalPaid`
- **Never negative** (clamped to 0)

### 4. Payment Status
Determined by these exact rules:

| Condition | Status |
|-----------|--------|
| `totalPaid === 0` | `"Pending"` |
| `totalPaid > 0` AND `balanceDue > 0` | `"Partial"` |
| `balanceDue === 0` | `"Paid"` |

---

## Test Cases

### Case A: No Successful Payments
```
Input:
  totalBillable = 50000
  payments = []

Expected Output:
  totalPaid = 0
  balanceDue = 50000
  paymentStatus = "Pending"
```

### Case B: Partial Payment
```
Input:
  totalBillable = 50000
  payments = [{ amount: 20000, status: 'Success' }]

Expected Output:
  totalPaid = 20000
  balanceDue = 30000
  paymentStatus = "Partial"
```

### Case C: Fully Paid
```
Input:
  totalBillable = 50000
  payments = [
    { amount: 20000, status: 'Success' },
    { amount: 30000, status: 'Success' }
  ]

Expected Output:
  totalPaid = 50000
  balanceDue = 0
  paymentStatus = "Paid"
```

### Case D: Mixed Payment Statuses
```
Input:
  totalBillable = 50000
  payments = [
    { amount: 20000, status: 'Success' },
    { amount: 10000, status: 'Failed' },
    { amount: 5000, status: 'Pending' }
  ]

Expected Output:
  totalPaid = 20000  (only Success counted)
  balanceDue = 30000
  paymentStatus = "Partial"
```

---

## Legacy Fields

The following Student model fields are **NOT** used in this service's calculations:
- `totalFees` (legacy field)
- `initialDeposit` (legacy field)
- `paymentStatus` (legacy field, stored but calculated)

These fields are preserved for backward compatibility but are not the source of truth for financial calculations.

---

## Database Safety

- **Read-only operations** - does not modify any records
- Uses existing Sequelize models and associations
- No schema changes required
- LEFT JOIN on payments (handles students with no payments)
- Safe type conversions (DECIMAL → number)

---

## Architecture Decisions

### Why a Separate Service?

1. **Single Source of Truth** - All financial calculations in one place
2. **Consistency** - Same logic across all modules (controllers, APIs, frontend)
3. **Maintainability** - Easy to update calculation rules
4. **Testability** - Isolated, pure calculation logic
5. **Reusability** - Can be imported anywhere in the backend

### What This Service Does NOT Do

- Does NOT create students
- Does NOT update students
- Does NOT create payments
- Does NOT update payments
- Does NOT delete records
- Does NOT interact with Razorpay
- Does NOT modify authentication/authorization
- Does NOT modify routes or controllers

---

## Future Integration

This service is designed to be integrated into:
1. Payment controllers (Step 2)
2. Student controllers (Step 3)
3. Financial reports (Step 4)
4. Admin dashboards (Step 5)

**Current Status:** Step 1 complete - Service created and ready for use.

---

## Files Created

- `backend/src/services/finance.service.js` - Main service implementation
- `backend/src/services/finance.service.test.js` - Test case specifications
- `backend/src/services/finance.service.README.md` - This documentation

---

## Verification

✅ Syntax validated with `node --check`  
✅ No unrelated files modified  
✅ Uses existing models and associations  
✅ Read-only operations only  
✅ Safe type handling for DECIMAL fields  
✅ Handles edge cases (null, undefined, zero payments)  
✅ Never returns negative balance  
✅ Exact payment status rules implemented  

---

## Next Steps

**DO NOT implement yet** - This is Step 1 only.

Future steps will:
1. Update payment controller to use this service
2. Update student controller to use this service
3. Create financial reporting endpoints
4. Update frontend to consume new endpoints
5. Deprecate direct use of legacy fields

Each step will be implemented separately with proper testing and validation.
