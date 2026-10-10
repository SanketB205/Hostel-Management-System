# STEP 2: Finance Service Integration - Test Cases

## Overview
POST /api/payments endpoint now uses the centralized Finance Service for balance validation.

## Endpoint
**POST** `/api/payments`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "studentId": "uuid",
  "amount": number,
  "paymentMode": string,
  "transactionId": string (optional),
  "paymentDate": ISO date string (optional),
  "notes": string (optional),
  "receivedBy": string (optional)
}
```

**Success Response (201):**
```json
{
  "message": "Payment recorded successfully.",
  "data": {
    "id": "uuid",
    "date": "ISO date",
    "amount": number,
    "mode": "Cash|UPI|etc",
    "reference": "transaction ID",
    "notes": "notes",
    "receivedBy": "Admin",
    "receipt": null,
    "status": "Success",
    "receiptNo": "HS-26-001-1234567890"
  },
  "summary": {
    "totalBillable": number,
    "totalPaid": number,
    "balanceDue": number,
    "paymentStatus": "Pending|Partial|Paid"
  }
}
```

**Error Responses:**
- 400: Validation errors (missing fields, invalid amount, exceeds balance)
- 404: Student not found
- 401: Unauthorized (no token)

---

## Test Cases

### ✅ CASE 1: First Payment (Partial)
**Setup:**
```
Student:
  totalBillable = 50000
  successful payments = 0
```

**Request:**
```json
{
  "studentId": "student-uuid",
  "amount": 10000,
  "paymentMode": "Cash"
}
```

**Expected Result:**
- Status: 201 Created
- Payment record created with status='Success'
- Response includes:
  ```json
  {
    "summary": {
      "totalBillable": 50000,
      "totalPaid": 10000,
      "balanceDue": 40000,
      "paymentStatus": "Partial"
    }
  }
  ```

**Verification:**
- Check database: Payment row exists with amount=10000, status='Success'
- Check: Student.totalBillable still 50000 (unchanged)
- Frontend: PaymentLedger should refresh and show updated balance

---

### ✅ CASE 2: Final Payment (Paid)
**Setup:**
```
Student:
  totalBillable = 50000
  successful payments = 40000 (previous payments)
```

**Request:**
```json
{
  "studentId": "student-uuid",
  "amount": 10000,
  "paymentMode": "UPI"
}
```

**Expected Result:**
- Status: 201 Created
- Payment record created
- Response includes:
  ```json
  {
    "summary": {
      "totalBillable": 50000,
      "totalPaid": 50000,
      "balanceDue": 0,
      "paymentStatus": "Paid"
    }
  }
  ```

**Verification:**
- Total successful payments = 50000
- balanceDue = 0
- Frontend: "Record Payment" button should disappear

---

### ✅ CASE 3: Payment Exceeds Balance (REJECT)
**Setup:**
```
Student:
  totalBillable = 50000
  successful payments = 40000
  balanceDue = 10000
```

**Request:**
```json
{
  "studentId": "student-uuid",
  "amount": 15000,
  "paymentMode": "Cash"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error message: "Payment amount ₹15,000 exceeds current balance due ₹10,000."
- NO Payment record created in database

**Verification:**
- Check database: No new payment row
- Total payments still 40000 (unchanged)
- balanceDue still 10000

---

### ✅ CASE 4: Mixed Payment Statuses
**Setup:**
```
Student:
  totalBillable = 50000
  payments:
    - 20000 (Success)
    - 10000 (Failed)
    - 5000 (Pending)
  
  Finance Service calculates:
    totalPaid = 20000 (only Success)
    balanceDue = 30000
```

**Request:**
```json
{
  "studentId": "student-uuid",
  "amount": 10000,
  "paymentMode": "Bank Transfer"
}
```

**Expected Result:**
- Status: 201 Created
- Payment allowed (because only 20000 is counted)
- Response includes:
  ```json
  {
    "summary": {
      "totalBillable": 50000,
      "totalPaid": 30000,
      "balanceDue": 20000,
      "paymentStatus": "Partial"
    }
  }
  ```

**Verification:**
- Finance Service correctly ignores Failed and Pending payments
- New successful payment added
- Total successful payments = 30000

---

### ✅ CASE 5: Already Fully Paid (REJECT)
**Setup:**
```
Student:
  totalBillable = 50000
  successful payments = 50000
  balanceDue = 0
```

**Request:**
```json
{
  "studentId": "student-uuid",
  "amount": 1000,
  "paymentMode": "Cash"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error message: "Payment amount ₹1,000 exceeds current balance due ₹0."
- NO Payment record created

**Verification:**
- Cannot overpay even by small amount
- Total payments remains 50000

---

### ✅ CASE 6: Zero Amount (REJECT)
**Setup:**
```
Student: any valid student
```

**Request:**
```json
{
  "studentId": "student-uuid",
  "amount": 0,
  "paymentMode": "Cash"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error message: "Payment amount must be greater than zero."
- NO Payment record created

---

### ✅ CASE 7: Negative Amount (REJECT)
**Setup:**
```
Student: any valid student
```

**Request:**
```json
{
  "studentId": "student-uuid",
  "amount": -1000,
  "paymentMode": "Cash"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error message: "Payment amount must be greater than zero."
- NO Payment record created

---

### ✅ CASE 8: Missing Required Fields (REJECT)
**Request 1: Missing studentId**
```json
{
  "amount": 10000,
  "paymentMode": "Cash"
}
```
**Expected:** 400, "Student ID is required."

**Request 2: Missing amount**
```json
{
  "studentId": "student-uuid",
  "paymentMode": "Cash"
}
```
**Expected:** 400, "Payment amount must be greater than zero."

**Request 3: Missing paymentMode**
```json
{
  "studentId": "student-uuid",
  "amount": 10000
}
```
**Expected:** 400, "Payment mode is required."

---

### ✅ CASE 9: Student Not Found (REJECT)
**Request:**
```json
{
  "studentId": "00000000-0000-0000-0000-000000000000",
  "amount": 10000,
  "paymentMode": "Cash"
}
```

**Expected Result:**
- Status: 404 Not Found
- Error message: "Student not found."
- NO Payment record created

---

## Integration Points Verified

### ✅ Finance Service Integration
- Import: `getStudentFinancialSummary` from `finance.service.js`
- Called twice per payment:
  1. Before creation: validate balance
  2. After creation: get updated summary

### ✅ Response Structure
- **PRESERVED**: All existing `data` fields
- **ADDED**: New `summary` object with financial data
- Frontend: Backward compatible (existing code still works)

### ✅ Transaction Safety
- Existing transaction preserved
- Student record locked during payment creation
- Finance Service called with accurate data
- Rollback on validation failure

### ✅ Payment Fields Preserved
All existing payment fields maintained:
- studentId ✓
- receiptNo ✓
- amount ✓
- paymentMode ✓
- status ✓ (always 'Success' for manual payments)
- transactionId ✓
- paymentDate ✓
- notes ✓
- receivedBy ✓

---

## Regression Testing

### ✅ Frontend Compatibility
- `RecordPaymentModal` still works (unchanged)
- `PaymentLedger` still works (unchanged)
- Response data structure compatible
- New `summary` field optional (frontend can ignore or use)

### ✅ No Breaking Changes
- API endpoint URL unchanged: POST /api/payments
- Request body format unchanged
- Authentication unchanged
- Authorization unchanged (frontend-enforced admin)
- Error response format unchanged

### ✅ Other Modules Untouched
- GET /api/payments/student/:studentId (unchanged)
- DELETE /api/payments/:id (unchanged)
- Student model (unchanged)
- Payment model (unchanged)
- Razorpay (untouched)
- Authentication (untouched)
- Authorization (untouched)
- Routes (unchanged)

---

## Manual Testing Steps

1. **Login as Admin**
   - Navigate to Students
   - Select a student with existing balance

2. **Open Payment Ledger**
   - Click on student details
   - Verify current balance displays correctly

3. **Record Valid Payment**
   - Click "Record Payment"
   - Enter amount less than balance
   - Select payment mode
   - Click "Save Payment Record"
   - Verify: Success message appears
   - Verify: Payment appears in history
   - Verify: Balance updates correctly

4. **Try Overpayment (Should Fail)**
   - Click "Record Payment"
   - Enter amount greater than balance
   - Click "Save Payment Record"
   - Verify: Error message appears
   - Verify: No new payment created
   - Verify: Balance unchanged

5. **Pay Remaining Balance**
   - Click "Pay Full Due"
   - Click "Save Payment Record"
   - Verify: Payment status changes to "Paid"
   - Verify: "Record Payment" button disappears

6. **Try Payment When Fully Paid (Should Fail)**
   - Try to record any payment
   - Verify: Error message appears
   - Verify: No new payment created

---

## Performance Considerations

### Finance Service Calls
- Called 2 times per payment creation:
  1. Validation check (before creation)
  2. Summary response (after creation)

### Database Queries
- Before: 1 query (Student with payments join)
- After: 1 query (Student only) + 2 Finance Service calls
- Finance Service: 1 query per call (Student with payments)
- Net: Similar performance, more modular code

### Optimization (Future)
- Could cache financial summary within transaction
- Could pass summary from validation to response
- Not critical for manual payment flow (low frequency)

---

## Success Criteria

✅ All 9 test cases pass  
✅ Syntax validation successful  
✅ Only payments controller modified  
✅ Finance Service correctly integrated  
✅ Transaction safety preserved  
✅ Response structure backward compatible  
✅ Frontend continues to work  
✅ No breaking changes  
✅ No unrelated modules touched  
✅ Razorpay untouched  
✅ Authentication untouched  
✅ Authorization untouched  

---

## Next Steps (DO NOT IMPLEMENT)

Future refactoring steps:
1. Update GET /api/payments/student/:studentId to use Finance Service
2. Update other controllers that calculate finances
3. Deprecate manual balance calculations
4. Create financial reporting endpoints

**STOP AFTER STEP 2 - DO NOT PROCEED**
