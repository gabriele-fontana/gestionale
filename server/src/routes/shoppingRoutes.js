const express = require('express');
const {
    listItems,
    createItem,
    setPurchased,
    deleteItem,
    clearPurchased,
} = require('../controllers/shoppingController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listItems);
router.post('/', createItem);
router.delete('/purchased', clearPurchased); // prima di '/:id', altrimenti "purchased" verrebbe letto come un id
router.patch('/:id', setPurchased);
router.delete('/:id', deleteItem);

module.exports = router;