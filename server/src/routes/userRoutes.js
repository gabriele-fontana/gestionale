const express = require('express');
const {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
} = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate); // tutte le route qui sotto richiedono il login

router.get('/', listUsers);
router.patch('/me/password', changePassword);
router.post('/', requireAdmin, createUser);
router.patch('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

module.exports = router;