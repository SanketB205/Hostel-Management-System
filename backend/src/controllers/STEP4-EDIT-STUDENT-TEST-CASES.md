# STEP 4: Edit Student Finance Validation - Test Cases

## Overview
The Edit Student flow now validates totalBillable changes using the Finance Service to ensure it never goes below the amount already paid.

## Endpoint
**PUT** `/api/students/:id`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "firstName": string,
  "lastName": string,
  "email": string,
  "totalBillable": number, // Only editable financial field
  // ... other student fields
  "allocation": {
    "roomNumber": string,
    "bedNumber": string
  }
}
```

---

## Architecture Changes

### Before STEP 4
- totalBillable could be set to any value
- No validation against existing payments
- Could create inconsistent financial state

### After STEP 4
- **Added:** Finance Service validation before update
- **Added:** Rejection if totalBillable < totalPaid
- **Added:** Validation for negative and invalid numbers
- **Preserved:** Transaction safety
- **Preserved:** All existing payment records unchanged

---

## Business Rule

### Source of Truth
```
Student.totalBillable (editable by admin)
+
Payment records (status='Success') (managed separately)
=
Finance Service calculates balance
```

### Payment Safety
**When totalBillable changes:**
- ✅ Student.totalBillable updates
- ❌ NO Payment records created
- ❌ NO Payment records deleted
- ❌ NO Payment records modified
- ❌ NO Payment.amount changed
- ❌ NO Payment.status changed

**Only the calculated balance changes**

---

## Test Cases

### ✅ CASE 1: Increase Billable Amount
**Current State:**
```json
{
  "totalBillable": 50000,
  "payments": [
    { "amount": 10000, "status": "Success" },
    { "amount": 10000, "status": "Success" }
  ]
}

Finance Service shows:
  totalPaid = 20000
  balanceDue = 30000
  paymentStatus = "Partial"
```

**Update:**
```json
{
  "totalBillable": 60000
}
```

**Expected Result:**
- Status: 200 OK
- Student.totalBillable = 60000
- Payment records: **UNCHANGED** (still 2 payments of 10000 each)

**New Financial State (via Finance Service):**
```json
{
  "totalBillable": 60000,
  "totalPaid": 20000,
  "balanceDue": 40000,
  "paymentStatus": "Partial"
}
```

**Verification:**
- Database: Student.totalBillable = 60000
- Database: Payment rows unchanged
- Payment count: Still 2
- Payment amounts: Still 10000 each

---

### ✅ CASE 2: Reduce Billable (Above Paid Amount)
**Current State:**
```json
{
  "totalBillable": 60000,
  "totalPaid": 20000,
  "balanceDue": 40000
}
```

**Update:**
```json
{
  "totalBillable": 40000
}
```

**Expected Result:**
- Status: 200 OK
- Student.totalBillable = 40000
- Payment records: **UNCHANGED**

**New Financial State:**
```json
{
  "totalBillable": 40000,
  "totalPaid": 20000,
  "balanceDue": 20000,
  "paymentStatus": "Partial"
}
```

**Verification:**
- Reduction allowed because 40000 > 20000 (paid)
- Balance due reduced from 40000 to 20000
- No payment modifications

---

### ✅ CASE 3: Set Billable Equal to Paid
**Current State:**
```json
{
  "totalBillable": 50000,
  "totalPaid": 20000,
  "balanceDue": 30000
}
```

**Update:**
```json
{
  "totalBillable": 20000
}
```

**Expected Result:**
- Status: 200 OK
- Student.totalBillable = 20000
- Payment records: **UNCHANGED**

**New Financial State:**
```json
{
  "totalBillable": 20000,
  "totalPaid": 20000,
  "balanceDue": 0,
  "paymentStatus": "Paid"
}
```

**Verification:**
- Allowed because 20000 = 20000 (equal to paid)
- Payment status now "Paid"
- Balance due = 0

---

### ✅ CASE 4: Billable Below Paid (REJECT)
**Current State:**
```json
{
  "totalBillable": 50000,
  "payments": [
    { "amount": 20000, "status": "Success" },
    { "amount": 10000, "status": "Success" }
  ]
}

Finance Service shows:
  totalPaid = 30000
```

**Attempt:**
```json
{
  "totalBillable": 20000
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error: "Total Billable (₹20,000) cannot be less than the amount already paid (₹30,000)."
- **NO database changes**
- Student.totalBillable remains 50000
- Payment records unchanged

**Verification:**
- Finance Service called before update
- Validation prevented inconsistent state
- Transaction not executed
- All data remains as before

---

### ✅ CASE 5: No Payments (Reduce Billable)
**Current State:**
```json
{
  "totalBillable": 50000,
  "payments": []
}

Finance Service shows:
  totalPaid = 0
  balanceDue = 50000
  paymentStatus = "Pending"
```

**Update:**
```json
{
  "totalBillable": 40000
}
```

**Expected Result:**
- Status: 200 OK
- Student.totalBillable = 40000

**New Financial State:**
```json
{
  "totalBillable": 40000,
  "totalPaid": 0,
  "balanceDue": 40000,
  "paymentStatus": "Pending"
}
```

**Verification:**
- Allowed because totalPaid = 0
- Can reduce to any non-negative value
- Status remains "Pending"

---

### ✅ CASE 6: Negative Amount (REJECT)
**Attempt:**
```json
{
  "totalBillable": -100
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error: "Total billable cannot be negative."
- NO database changes
- Student data unchanged

---

### ✅ CASE 7: Invalid Number (REJECT)
**Attempt:**
```json
{
  "totalBillable": "not a number"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error: "Total billable must be a valid number."
- NO database changes

---

### ✅ CASE 8: Exactly at Limit (Edge Case)
**Current State:**
```json
{
  "totalPaid": 30000
}
```

**Update:**
```json
{
  "totalBillable": 30000
}
```

**Expected Result:**
- Status: 200 OK
- Allowed (equal to paid amount)
- balanceDue = 0
- paymentStatus = "Paid"

---

### ✅ CASE 9: Mixed Payment Statuses
**Current State:**
```json
{
  "payments": [
    { "amount": 20000, "status": "Success" },
    { "amount": 10000, "status": "Failed" },
    { "amount": 5000, "status": "Pending" }
  ]
}

Finance Service shows:
  totalPaid = 20000 (only Success counted)
```

**Attempt:**
```json
{
  "totalBillable": 15000
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error: "Total Billable (₹15,000) cannot be less than the amount already paid (₹20,000)."
- Finance Service correctly ignores Failed and Pending payments

**Verification:**
- Only successful payments count toward validation
- Failed and Pending don't affect the limit

---

## Validation Logic

### New Validation Added (Lines 901-929)
```javascript
// 1. Check if totalBillable is being changed
if (totalBillable !== undefined && totalBillable !== null && totalBillable !== '') {
  const newBillable = parseFloat(totalBillable);
  
  // 2. Validate it's a valid number
  if (isNaN(newBillable)) {
    return res.status(400).json({ message: 'Total billable must be a valid number.' });
  }
  
  // 3. Validate it's not negative
  if (newBillable < 0) {
    return res.status(400).json({ message: 'Total billable cannot be negative.' });
  }

  // 4. Get current financial summary from Finance Service
  const financialSummary = await getStudentFinancialSummary(student.id);
  const currentTotalPaid = financialSummary.totalPaid;

  // 5. Validate new billable >= amount already paid
  if (newBillable < currentTotalPaid) {
    return res.status(400).json({ 
      message: `Total Billable (₹${newBillable.toLocaleString('en-IN')}) cannot be less than the amount already paid (₹${currentTotalPaid.toLocaleString('en-IN')}).` 
    });
  }
}
```

### Validation Flow
```
1. Extract totalBillable from request
2. If totalBillable provided:
   a. Parse as float
   b. Check if valid number (not NaN)
   c. Check if non-negative
   d. Call Finance Service to get totalPaid
   e. Check if newBillable >= totalPaid
   f. REJECT if any validation fails
3. Proceed with transaction if all validations pass
```

---

## Finance Service Integration

### Before Update
```javascript
// Get current financial state
const financialSummary = await getStudentFinancialSummary(student.id);
const currentTotalPaid = financialSummary.totalPaid;

// Validate against current state
if (newBillable < currentTotalPaid) {
  // REJECT
}
```

### After Update
```javascript
// Finance Service automatically calculates from:
// - New Student.totalBillable (updated)
// - Existing Payment records (unchanged)

const updatedSummary = await getStudentFinancialSummary(student.id);
// updatedSummary.balanceDue = new calculation
// updatedSummary.paymentStatus = new status
```

---

## Payment Safety Verification

### What Changes
- ✅ Student.totalBillable

### What NEVER Changes
- ❌ Payment.amount
- ❌ Payment.status
- ❌ Payment.paymentMode
- ❌ Payment.transactionId
- ❌ Payment.paymentDate
- ❌ Payment.receiptNo
- ❌ Payment.notes
- ❌ Payment.receivedBy

### Database Operations
```sql
-- Only this happens:
UPDATE students SET total_billable = ? WHERE id = ?;

-- These NEVER happen:
UPDATE payments ...;
DELETE FROM payments ...;
INSERT INTO payments ...;
```

---

## Transaction Safety

### Preserved Behavior
```javascript
await sequelize.transaction(async (transaction) => {
  // 1. Resolve academic fields
  // 2. Update user email if changed
  // 3. Update student details (including totalBillable)
  // 4. Handle room allocation if changed
  
  // All atomic - rollback on any error
});
```

**Validation happens BEFORE transaction:**
- Finance Service called outside transaction
- No unnecessary transaction overhead
- Fast failure on validation errors

---

## Legacy Fields

### NOT Modified ✅
- `Student.totalFees` (preserved)
- `Student.initialDeposit` (preserved)
- `Student.paymentStatus` (preserved)

### NOT Used in Validation ✅
```javascript
// Finance Service uses:
const totalPaid = successfulPayments.reduce(
  (sum, p) => sum + parseFloat(p.amount || 0), 
  0
);

// NOT Student.initialDeposit
// NOT Student.totalFees
```

---

## Frontend Compatibility

### EditStudentPage.jsx
**Already implemented (from previous work):**
- totalBillable field exists ✓
- Payment summary displayed (read-only) ✓
- Validation on frontend ✓
- Error handling ✓

**No changes required:**
- UI layout unchanged
- Form fields unchanged
- API contract unchanged
- Error display unchanged

---

## Error Messages

### New Validation Errors
```json
{
  "message": "Total billable must be a valid number."
}
{
  "message": "Total billable cannot be negative."
}
{
  "message": "Total Billable (₹20,000) cannot be less than the amount already paid (₹30,000)."
}
```

### Existing Errors (Preserved)
```json
{
  "message": "Student not found."
}
{
  "message": "Email is already in use by another student."
}
{
  "message": "Registration number is already in use."
}
// ... other validation errors
```

---

## Manual Testing Steps

### Test Scenario 1: Increase Billable
1. Login as Admin
2. Navigate to Students
3. Click Edit on a student with existing payments
4. Note current: Total Billable = 50000, Total Paid = 20000
5. Change Total Billable to 60000
6. Click Save
7. **Verify:** Success message
8. **Verify:** Payment Ledger shows balance = 40000
9. **Verify:** Payment history unchanged

### Test Scenario 2: Try to Set Below Paid (Should Fail)
1. Login as Admin
2. Edit same student
3. Note: Total Paid = 20000
4. Try to change Total Billable to 15000
5. Click Save
6. **Verify:** Error message appears
7. **Verify:** Student not updated
8. **Verify:** Payment history unchanged

### Test Scenario 3: Set Equal to Paid
1. Login as Admin
2. Edit student with Total Paid = 20000
3. Change Total Billable to 20000
4. Click Save
5. **Verify:** Success
6. **Verify:** Payment Ledger shows balance = 0
7. **Verify:** Payment Status = "Paid"

---

## Success Criteria

✅ Finance Service integrated into Edit Student flow  
✅ totalBillable validated against totalPaid  
✅ Rejection when totalBillable < totalPaid  
✅ Payment records never modified  
✅ Transaction safety preserved  
✅ Legacy fields preserved  
✅ No frontend changes required  
✅ No database schema changes  
✅ All test cases validated  

---

## What Was NOT Changed

### ✅ Frontend
- EditStudentPage.jsx: **Unchanged**
- Payment displays: **Already implemented**
- Form validation: **Enhanced (backend only)**

### ✅ Models & Schema
- Student model: **Unchanged**
- Payment model: **Unchanged**
- Database schema: **No changes**
- Migrations: **None required**

### ✅ Other Endpoints
- GET /api/students: **Untouched**
- DELETE /api/students/:id: **Untouched**
- POST /api/students: **Untouched** (Step 3 preserved)
- POST /api/payments: **Untouched** (Step 2 preserved)

### ✅ Authentication & Authorization
- Login flows: **Untouched**
- JWT middleware: **Untouched**
- Role checks: **Untouched**

### ✅ Other Modules
- Rooms: **Untouched**
- Staff: **Untouched**
- Attendance: **Untouched**
- Complaints: **Untouched**
- Departments: **Untouched**
- Allocations: **Untouched**
- Razorpay: **Untouched**

---

## Next Steps (DO NOT IMPLEMENT)

Future improvements could include:
1. Audit log for totalBillable changes
2. Financial reports using Finance Service
3. Bulk student financial updates
4. Dashboard financial widgets
5. Alert system for overpaid students

**STOP AFTER STEP 4 - DO NOT PROCEED**
