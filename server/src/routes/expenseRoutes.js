const express = require('express');
const {
    listExpenses,
    createExpense,
    deleteExpense,
    getBalances,
    createSettlement,
} = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listExpenses);
router.get('/balances', getBalances);
router.post('/', createExpense);
router.post('/settlements', createSettlement);
router.delete('/:id', deleteExpense);

module.exports = router;