const pool = require('../db');

exports.getDashboardData = async (req, res) => {
  try {
    const studentId = req.user.id;
    const responseData = {};

    // 1. Active Billing Cycle safely
    let cycleId = null;
    try {
      const cycleRes = await pool.query(`
        SELECT cycle_id, cycle_name, start_date, end_date FROM "BillingCycle"
        WHERE CURRENT_DATE BETWEEN start_date AND end_date
        LIMIT 1
      `);
      if (cycleRes.rows.length > 0) {
          cycleId = cycleRes.rows[0].cycle_id;
          responseData.billingCycle = cycleRes.rows[0];
      } else {
          responseData.billingCycle = null;
      }
    } catch (e) {
      responseData.billingCycle = { error: e.message };
    }

    // 2. Current Mess Registration
    try {
        if (cycleId) {
            const regRes = await pool.query(`
                SELECT mr.*, m.name as mess_name, m.location as mess_location 
                FROM "MessRegistration" mr
                JOIN "Mess" m ON mr.mess_id = m.mess_id
                WHERE mr.student_id = $1 AND mr.cycle_id = $2
            `, [studentId, cycleId]);
            responseData.messRegistration = regRes.rows[0] || null;
        } else {
            responseData.messRegistration = null;
        }
    } catch (e) {
        responseData.messRegistration = { error: e.message };
    }

    // 3. Fee Summary
    try {
        if (cycleId) {
            const feeRes = await pool.query(`SELECT fee_record_id, total_due, payment_status FROM "FeeRecord" WHERE student_id = $1 AND cycle_id = $2`, [studentId, cycleId]);
            if (feeRes.rows.length > 0) {
               const record = feeRes.rows[0];
               const paidRes = await pool.query(`SELECT COALESCE(SUM(amount), 0) as paid_amount FROM "Payment" WHERE fee_record_id = $1`, [record.fee_record_id]);
               const paid = parseFloat(paidRes.rows[0].paid_amount);
               responseData.feeSummary = {
                  ...record,
                  remaining_due: parseFloat(record.total_due) - paid
               };
            } else {
               responseData.feeSummary = { remaining_due: 0, payment_status: 'No Record' };
            }
        } else {
            responseData.feeSummary = { remaining_due: 0, payment_status: 'No Active Cycle' };
        }
    } catch (e) {
        responseData.feeSummary = { error: e.message };
    }

    // 4. Today's Menu
    try {
        if (responseData.messRegistration && responseData.messRegistration.mess_id) {
            const dayNum = new Date().getDay(); // 0 is Sunday
            const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const currentDayShort = dayMap[dayNum];

            const menuRes = await pool.query(`
              SELECT mc.meal_session, mi.name, mi.price 
              FROM "MenuSchedule" ms
              JOIN "MenuCycle" mc ON ms.cycle_id = mc.cycle_id
              JOIN "MenuItem" mi ON ms.item_id = mi.item_id
              WHERE ms.mess_id = $1 AND mc.day_of_week = $2
            `, [responseData.messRegistration.mess_id, currentDayShort]);
            
            const sessions = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
            const groupedMenu = {};
            sessions.forEach(s => groupedMenu[s] = []);
            
            menuRes.rows.forEach(row => {
                if (groupedMenu[row.meal_session]) {
                    groupedMenu[row.meal_session].push({ name: row.name, price: row.price });
                }
            });
            responseData.todaysMenu = groupedMenu;
        } else {
            responseData.todaysMenu = null;
        }
    } catch (e) {
        responseData.todaysMenu = { error: e.message };
    }

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading dashboard' });
  }
};
