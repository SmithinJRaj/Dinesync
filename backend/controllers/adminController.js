const pool = require('../db');

// --- MESS MANAGEMENT ---
exports.getMesses = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM "Mess" ORDER BY mess_id ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addMess = async (req, res) => {
    try {
        const { name, location, capacity, guest_capacity_per_session } = req.body;
        if (!name || !location || !capacity) return res.status(400).json({ message: 'Missing required fields' });
        
        const result = await pool.query(
            `INSERT INTO "Mess" (name, location, capacity, guest_capacity_per_session) VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, location, capacity, guest_capacity_per_session || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateMess = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, capacity, guest_capacity_per_session } = req.body;
        const result = await pool.query(
            `UPDATE "Mess" SET name = $1, location = $2, capacity = $3, guest_capacity_per_session = $4 WHERE mess_id = $5 RETURNING *`,
            [name, location, capacity, guest_capacity_per_session, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Mess not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteMess = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Block deletion if active registrations exist in current BillingCycle
        const cycleRes = await pool.query(`SELECT cycle_id FROM "BillingCycle" WHERE CURRENT_DATE BETWEEN start_date AND end_date LIMIT 1`);
        if (cycleRes.rows.length > 0) {
            const activeCycle = cycleRes.rows[0].cycle_id;
            const regCount = await pool.query(`SELECT COUNT(*) FROM "MessRegistration" WHERE mess_id = $1 AND cycle_id = $2`, [id, activeCycle]);
            if (parseInt(regCount.rows[0].count) > 0) {
                return res.status(400).json({ message: 'Cannot delete Mess: Active registrations exist in the current Billing Cycle.' });
            }
        }
        
        // Check historical block
        const histReg = await pool.query(`SELECT COUNT(*) FROM "MessRegistration" WHERE mess_id = $1`, [id]);
        if (parseInt(histReg.rows[0].count) > 0) {
             return res.status(400).json({ message: 'Cannot delete Mess: Historical registrations exist.' });
        }

        const result = await pool.query(`DELETE FROM "Mess" WHERE mess_id = $1 RETURNING *`, [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Mess not found' });
        res.json({ message: 'Mess deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// --- MENU MANAGEMENT ---
exports.getAdminMenu = async (req, res) => {
    try {
        const { messId } = req.query;
        if (!messId) return res.status(400).json({ message: 'messId query parameter is required' });

        const result = await pool.query(`
            SELECT ms.mess_id, mc.cycle_id, mc.day_of_week, mc.meal_session, mi.item_id, mi.name 
            FROM "MenuSchedule" ms
            JOIN "MenuCycle" mc ON ms.cycle_id = mc.cycle_id
            JOIN "MenuItem" mi ON ms.item_id = mi.item_id
            WHERE ms.mess_id = $1
            ORDER BY mc.day_of_week, mc.meal_session
        `, [messId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.setAdminMenu = async (req, res) => {
    const client = await pool.connect();
    try {
        const { mess_id, cycle_id, items } = req.body; 
        if (!mess_id || !cycle_id || !Array.isArray(items)) {
            return res.status(400).json({ message: 'mess_id, cycle_id, and items array required.' });
        }

        await client.query('BEGIN');
        
        // Delete existing entries for controlled replacement
        await client.query(`DELETE FROM "MenuSchedule" WHERE mess_id = $1 AND cycle_id = $2`, [mess_id, cycle_id]);

        // Insert new ones ignoring duplicates if accidentally passed inside body
        const uniqueItems = [...new Set(items)];
        for (const item_id of uniqueItems) {
            await client.query(
                `INSERT INTO "MenuSchedule" (mess_id, cycle_id, item_id) VALUES ($1, $2, $3)`,
                [mess_id, cycle_id, item_id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Menu updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
};

exports.getMenuCyclesItems = async (req, res) => {
     try {
         const cycles = await pool.query(`SELECT * FROM "MenuCycle"`);
         const items = await pool.query(`SELECT * FROM "MenuItem"`);
         res.json({ cycles: cycles.rows, items: items.rows });
     } catch (err) {
          res.status(500).json({ message: err.message });
     }
}

exports.addMenuItem = async (req, res) => {
    try {
        const { name, price } = req.body;
        const result = await pool.query(
            `INSERT INTO "MenuItem" (name, price) VALUES ($1, $2) RETURNING *`,
            [name, price || 50.00]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// --- BILLING CYCLE MANAGEMENT ---
exports.getBillingCycles = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM "BillingCycle" ORDER BY start_date DESC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addBillingCycle = async (req, res) => {
    try {
        const { cycle_name, start_date, end_date } = req.body;
        if (!cycle_name || !start_date || !end_date) return res.status(400).json({ message: 'All fields required' });

        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({ message: 'start_date must be before end_date' });
        }

        // Prevent overlapping
        const overlap = await pool.query(`
            SELECT cycle_id FROM "BillingCycle" 
            WHERE ($1 <= end_date AND $2 >= start_date)
        `, [start_date, end_date]);

        if (overlap.rows.length > 0) {
            return res.status(400).json({ message: 'Overlapping Billing Cycle detected' });
        }

        const result = await pool.query(
            `INSERT INTO "BillingCycle" (cycle_name, start_date, end_date) VALUES ($1, $2, $3) RETURNING *`,
            [cycle_name, start_date, end_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteBillingCycle = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');
        
        const cycle = await client.query(`SELECT start_date, end_date FROM "BillingCycle" WHERE cycle_id = $1`, [id]);
        if (cycle.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Billing Cycle not found' });
        }
        const { start_date, end_date } = cycle.rows[0];
        
        await client.query(`DELETE FROM "SignOff" WHERE start_date >= $1 AND end_date <= $2`, [start_date, end_date]);
        await client.query(`DELETE FROM "GuestService" WHERE request_date >= $1 AND request_date <= $2`, [start_date, end_date]);
        await client.query(`DELETE FROM "AddOnTransaction" WHERE purchase_date::DATE >= $1 AND purchase_date::DATE <= $2`, [start_date, end_date]);
        
        const result = await client.query(`DELETE FROM "BillingCycle" WHERE cycle_id = $1 RETURNING *`, [id]);
        
        await client.query('COMMIT');
        res.json({ message: 'Billing Cycle deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
};

exports.simulateEndCycle = async (req, res) => {
    try {
        const cycleRes = await pool.query(`
            SELECT cycle_id FROM "BillingCycle"
            WHERE CURRENT_DATE BETWEEN start_date AND end_date
            LIMIT 1
        `);
        if (cycleRes.rows.length === 0) return res.status(400).json({ message: 'No active billing cycle found.' });
        const cycleId = cycleRes.rows[0].cycle_id;

        await pool.query(`UPDATE "BillingCycle" SET start_date = LEAST(start_date, (CURRENT_DATE - INTERVAL '1 day')::date), end_date = (CURRENT_DATE - INTERVAL '1 day')::date WHERE cycle_id = $1`, [cycleId]);
        res.json({ message: 'Active cycle forcefully ended for simulation.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// --- REQUESTS & APPROVALS ---
exports.updateSignOff = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const current = await pool.query(`SELECT status, start_date FROM "SignOff" WHERE signoff_id = $1`, [id]);
        if (current.rows.length === 0) return res.status(404).json({ message: 'SignOff not found' });
        
        if (status === 'REJECTED') {
            const startDate = new Date(current.rows[0].start_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (startDate <= today) {
                return res.status(400).json({ message: 'Cannot disapprove on or after the start date.' });
            }
        }

        const result = await pool.query(`UPDATE "SignOff" SET status = $1 WHERE signoff_id = $2 RETURNING *`, [status, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateGuestRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const current = await pool.query(`SELECT status, request_date FROM "GuestService" WHERE guest_request_id = $1`, [id]);
        if (current.rows.length === 0) return res.status(404).json({ message: 'Request not found' });

        if (status === 'REJECTED') {
            const requestDate = new Date(current.rows[0].request_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (requestDate <= today) {
                return res.status(400).json({ message: 'Cannot disapprove on or after the request date.' });
            }
        }

        const result = await pool.query(`UPDATE "GuestService" SET status = $1 WHERE guest_request_id = $2 RETURNING *`, [status, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const signoffs = await pool.query(`
            SELECT s.*, st.name as student_name 
            FROM "SignOff" s JOIN "Student" st ON s.student_id = st.student_id 
            ORDER BY s.signoff_id DESC
        `);
        const guests = await pool.query(`
            SELECT g.*, st.name as student_name 
            FROM "GuestService" g JOIN "Student" st ON g.student_id = st.student_id 
            ORDER BY g.guest_request_id DESC
        `);
        res.json({ signoffs: signoffs.rows, guests: guests.rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// --- FEE MONITORING ---
exports.getFeeMonitor = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                f.*, 
                s.name as student_name, 
                b.cycle_name,
                COALESCE(p.paid_sum, 0) as paid_amount,
                (f.total_due - COALESCE(p.paid_sum, 0)) as remaining_due
            FROM "FeeRecord" f
            JOIN "Student" s ON f.student_id = s.student_id
            JOIN "BillingCycle" b ON f.cycle_id = b.cycle_id
            LEFT JOIN (
                SELECT fee_record_id, SUM(amount) as paid_sum 
                FROM "Payment" 
                GROUP BY fee_record_id
            ) p ON f.fee_record_id = p.fee_record_id
            ORDER BY f.fee_record_id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// --- USER MANAGEMENT ---
exports.getUsersAdmin = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.user_id, a.username, a.role, a.account_status, 
                COALESCE(s.name, ad.name) as name, 
                COALESCE(s.email, ad.email) as email
            FROM "Account" a
            LEFT JOIN "Student" s ON a.user_id = s.student_id
            LEFT JOIN "Admin" ad ON a.user_id = ad.admin_id
            ORDER BY a.role, name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleAccountStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const current = await pool.query(`SELECT account_status, role FROM "Account" WHERE user_id = $1`, [id]);
        if (current.rows.length === 0) return res.status(404).json({ message: 'Account not found' });
        
        if (current.rows[0].role === 'ADMIN') {
            return res.status(400).json({ message: 'Cannot disable admin accounts' });
        }

        const nextStatus = current.rows[0].account_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const result = await pool.query(`UPDATE "Account" SET account_status = $1 WHERE user_id = $2 RETURNING username, account_status`, [nextStatus, id]);
        
        res.json(result.rows[0]);
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};
