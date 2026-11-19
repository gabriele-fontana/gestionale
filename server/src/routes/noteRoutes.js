const express = require('express');
const { listNotes, createNote, deleteNote } = require('../controllers/noteController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);

module.exports = router;