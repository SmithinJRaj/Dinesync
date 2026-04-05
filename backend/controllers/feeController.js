const prisma = require('../prisma');

// @desc    Calculate and viewing fee for current user
// @route   GET /api/fees/my-fee
// @access  User
const calculateMyFee = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const registration = await prisma.messRegistration.findFirst({
       where: { userId }
    });
    
    if (!registration) {
       return res.status(403).json({ message: 'User is not registered to any mess' });
    }

    const BASE_PRICE = 3000;
    
    const signOffs = await prisma.signOff.findMany({
      where: { userId }
    });

    let signOffDays = 0;
    signOffs.forEach((so) => {
      const diffTime = Math.abs(so.endDate - so.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      signOffDays += (diffDays + 1); 
    });

    const payments = await prisma.payment.findMany({ where: { userId } });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const perDayCost = BASE_PRICE / 30;
    const deduction = signOffDays * perDayCost;
    const calculatedFee = BASE_PRICE - deduction;
    const currentBalance = Math.max(0, calculatedFee - totalPaid);

    res.json({
      basePrice: BASE_PRICE,
      signOffDays,
      deduction,
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
    
    const record = await prisma.feeRecord.create({
      data: {
        userId,
        totalAmount: parseFloat(totalAmount),
        status: 'PENDING'
      }
    });
    res.status(201).json(record);
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

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: parseFloat(amount)
      }
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing payment: ' + error.message, stack: error.stack  });
  }
};

// @desc    Get user's historical successful payments
// @route   GET /api/fees/payments
// @access  User
const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { id: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching payment records: ' + error.message, stack: error.stack });
  }
};

module.exports = { calculateMyFee, generateFeeRecord, processPayment, getMyPayments };
