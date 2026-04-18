const pool = require('../db');

// @desc    Calculate and viewing fee for current user
// @route   GET /api/fees/my-fee
// @access  User
const calculateMyFee = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check mess registration for base price
    const registrationResult = await pool.query(`SELECT * FROM "MessRegistration" WHERE "userId" = $1`, [userId]);
    const registration = registrationResult.rows[0];

    let BASE_PRICE = 0;
    let signOffDays = 0;
    let deduction = 0;

    if (registration) {
      BASE_PRICE = 3000;

      const signOffsResult = await pool.query(`SELECT * FROM "SignOff" WHERE "userId" = $1`, [userId]);
      const signOffs = signOffsResult.rows;

      signOffs.forEach((so) => {
        const diffTime = Math.abs(new Date(so.endDate) - new Date(so.startDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        signOffDays += (diffDays + 1);
      });

      const perDayCost = BASE_PRICE / 30;
      deduction = signOffDays * perDayCost;
    }

    // Calculate Guest Request fees
    const guestRequestsResult = await pool.query(`SELECT "mealType" FROM "GuestRequest" WHERE "userId" = $1`, [userId]);
    const guestRequests = guestRequestsResult.rows;
    let guestFees = 0;

    guestRequests.forEach((req) => {
      if (req.mealType === 'Breakfast') guestFees += 40;
      else if (req.mealType === 'Lunch') guestFees += 70;
      else if (req.mealType === 'Dinner') guestFees += 60;
      else guestFees += 50; // Fallback
    });

    const paymentsResult = await pool.query(`SELECT amount FROM "Payment" WHERE "userId" = $1`, [userId]);
    const payments = paymentsResult.rows;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const calculatedFee = BASE_PRICE - deduction + guestFees;
    const currentBalance = Math.max(0, calculatedFee - totalPaid);

    res.json({
      basePrice: BASE_PRICE,
      signOffDays,
      deduction,
      guestFees,
      finalFee: currentBalance,
      totalPaid
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error calculating fee' });
  }
};

// @desc    Generate a Fee Record for a user
// @route   POST /api/fees/generate/:userId
// @access  Admin
const generateFeeRecord = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { totalAmount } = req.body;
    if (totalAmount == null) {
      return res.status(400).json({ message: 'Total amount is required' });
    }

    const result = await pool.query(
      `INSERT INTO "FeeRecord" ("userId", "totalAmount", status) VALUES ($1, $2, 'PENDING') RETURNING *`,
      [userId, parseFloat(totalAmount)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating fee record' });
  }
};

// @desc    Process a mock payment
// @route   POST /api/fees/pay
// @access  User
const processPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const result = await pool.query(
      `INSERT INTO "Payment" ("userId", amount) VALUES ($1, $2) RETURNING *`,
      [userId, parseFloat(amount)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing payment: ' + error.message, stack: error.stack });
  }
};

// @desc    Get user's historical successful payments
// @route   GET /api/fees/payments
// @access  User
const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`SELECT * FROM "Payment" WHERE "userId" = $1 ORDER BY id DESC`, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching payment records: ' + error.message, stack: error.stack });
  }
};

module.exports = { calculateMyFee, generateFeeRecord, processPayment, getMyPayments };
