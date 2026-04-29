const pool = require('../db');

// @desc    Calculate and generated FeeRecord for current user
// @route   GET /api/fees/record
// @access  User
const getFeeRecord = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch ACTIVE BillingCycle
    const cycleRes = await pool.query(`
        SELECT cycle_id, cycle_name FROM "BillingCycle"
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        LIMIT 1
    `);
    
    if (cycleRes.rows.length === 0) {
        return res.json({ message: 'No active billing cycle.', total_due: 0 });
    }

    const cycleId = cycleRes.rows[0].cycle_id;
    const cycleName = cycleRes.rows[0].cycle_name;

    const registrationResult = await pool.query(`
        SELECT * FROM "MessRegistration" 
        WHERE student_id = $1 AND cycle_id = $2
    `, [studentId, cycleId]);
    
    const registration = registrationResult.rows[0];

    // Check if FeeRecord exists for this cycle
    let feeRecordRes = await pool.query(`SELECT * FROM "FeeRecord" WHERE student_id = $1 AND cycle_id = $2`, [studentId, cycleId]);

    // Calculate dynamically
    let BASE_CHARGE = registration ? 3000.00 : 0.00;

    // 1. Signoff Deduction logic
    const signoffRes = await pool.query(`
        SELECT COUNT(*) as days 
        FROM "SignOff" 
        WHERE student_id = $1 AND status = 'APPROVED'
    `, [studentId]);
    const approvedSignOffDays = parseInt(signoffRes.rows[0].days) || 0;
    const SIGNOFF_DEDUCTION_PER_DAY = 100.00; // Rs 100 refund per day
    const SIGNOFF_DEDUCTION = approvedSignOffDays * SIGNOFF_DEDUCTION_PER_DAY;

    // 2. Guest Service logic
    const guestRes = await pool.query(`
        SELECT COUNT(*) as total_guests
        FROM "GuestService"
        WHERE student_id = $1 AND status = 'APPROVED'
    `, [studentId]);
    const totalApprovedGuests = parseInt(guestRes.rows[0].total_guests) || 0;
    const GUEST_FEE_PER_MEAL = 150.00;
    BASE_CHARGE += (totalApprovedGuests * GUEST_FEE_PER_MEAL);

    const addonRes = await pool.query(`
        SELECT a.quantity, m.price 
        FROM "AddOnTransaction" a
        JOIN "MenuItem" m ON a.item_id = m.item_id
        WHERE a.student_id = $1
    `, [studentId]);
    
    let ADDON_TOTAL = 0.00;
    addonRes.rows.forEach(r => {
        ADDON_TOTAL += (r.quantity * parseFloat(r.price));
    });

    const TOTAL_DUE = BASE_CHARGE - SIGNOFF_DEDUCTION + ADDON_TOTAL;

    // If it doesn't exist, create it. If it does, update ONLY calculated fields (not payment_status).
    let feeRecord;
    if (feeRecordRes.rows.length === 0) {
        const insertRes = await pool.query(`
            INSERT INTO "FeeRecord" (student_id, cycle_id, base_charge, signoff_deduction, addon_total, total_due, payment_status)
            VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *
        `, [studentId, cycleId, BASE_CHARGE, SIGNOFF_DEDUCTION, ADDON_TOTAL, TOTAL_DUE]);
        feeRecord = insertRes.rows[0];
    } else {
        const updateRes = await pool.query(`
            UPDATE "FeeRecord" 
            SET base_charge = $1, signoff_deduction = $2, addon_total = $3, total_due = $4
            WHERE fee_record_id = $5 RETURNING *
        `, [BASE_CHARGE, SIGNOFF_DEDUCTION, ADDON_TOTAL, TOTAL_DUE, feeRecordRes.rows[0].fee_record_id]);
        feeRecord = updateRes.rows[0];
    }

    // Append cycle_name specifically for UI
    feeRecord.cycle_name = cycleName;

    // Also get SUM of what constitutes PAID so we can calculate amount strictly left
    const paidRes = await pool.query(`SELECT COALESCE(SUM(amount), 0) as paid_amount FROM "Payment" WHERE fee_record_id = $1`, [feeRecord.fee_record_id]);
    feeRecord.paid_amount = parseFloat(paidRes.rows[0].paid_amount);
    feeRecord.remaining_due = parseFloat(feeRecord.total_due) - feeRecord.paid_amount;

    let computed_status = 'PENDING';
    if (feeRecord.remaining_due <= 0 && feeRecord.total_due > 0) computed_status = 'PAID';
    else if (feeRecord.remaining_due <= 0 && feeRecord.total_due === 0) computed_status = 'PAID';
    else if (feeRecord.paid_amount > 0) computed_status = 'PARTIAL';
    else computed_status = 'PENDING';

    if (feeRecord.payment_status !== computed_status) {
        await pool.query(`UPDATE "FeeRecord" SET payment_status = $1 WHERE fee_record_id = $2`, [computed_status, feeRecord.fee_record_id]);
        feeRecord.payment_status = computed_status;
    }

    res.json(feeRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error calculating fee' });
  }
};

// @desc    Process a dynamic payment
// @route   POST /api/fees/pay
// @access  User
const processPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const studentId = req.user.id;
    const { amount, fee_record_id } = req.body;

    if (!amount || parseFloat(amount) <= 0 || !fee_record_id) {
      return res.status(400).json({ message: 'Valid payment amount and fee record ID are required' });
    }

    const payAmount = parseFloat(amount);

    await client.query('BEGIN'); // Start Transaction

    // Lock the row for update
    const recordRes = await client.query(`SELECT * FROM "FeeRecord" WHERE fee_record_id = $1 FOR UPDATE`, [parseInt(fee_record_id)]);
    const feeRecord = recordRes.rows[0];

    if (!feeRecord) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Fee record not found' });
    }

    // Get current paid amount
    const paidRes = await client.query(`SELECT COALESCE(SUM(amount), 0) as total_paid FROM "Payment" WHERE fee_record_id = $1`, [parseInt(fee_record_id)]);
    const totalPaid = parseFloat(paidRes.rows[0].total_paid);
    const totalDue = parseFloat(feeRecord.total_due);
    const remainingDue = totalDue - totalPaid;

    if (payAmount > remainingDue) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Cannot overpay. Remaining balance is ₹${remainingDue}` });
    }

    // Insert payment
    const paymentRes = await client.query(
      `INSERT INTO "Payment" (fee_record_id, amount, recorded_by) VALUES ($1, $2, $3) RETURNING *`,
      [parseInt(fee_record_id), payAmount, studentId]
    );

    // Update status
    const newTotalPaid = totalPaid + payAmount;
    let newStatus = 'PENDING';
    if (newTotalPaid >= totalDue) {
        newStatus = 'PAID';
    } else if (newTotalPaid > 0) {
        newStatus = 'PARTIAL';
    }

    await client.query(`UPDATE "FeeRecord" SET payment_status = $1 WHERE fee_record_id = $2`, [newStatus, parseInt(fee_record_id)]);

    await client.query('COMMIT'); // Commit Transaction

    res.status(201).json({ payment: paymentRes.rows[0], newStatus });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error processing payment: ' + error.message });
  } finally {
    client.release();
  }
};

module.exports = { getFeeRecord, processPayment };
