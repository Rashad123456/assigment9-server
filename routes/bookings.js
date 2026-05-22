const express = require('express');
const { ObjectId } = require('mongodb');
const { connectDB } = require('../middleware/db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// GET my bookings (private)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const db = await connectDB();
    const bookings = await db.collection('bookings')
      .find({ user_email: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create booking (private)
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = await connectDB();
    const booking = {
      ...req.body,
      user_email: req.user.email,
      status: 'pending',
      createdAt: new Date()
    };
    const result = await db.collection('bookings').insertOne(booking);

    // increment booking_count on facility
    if (booking.facility_id) {
      await db.collection('facilities').updateOne(
        { _id: new ObjectId(booking.facility_id) },
        { $inc: { booking_count: 1 } }
      );
    }

    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH cancel booking (private)
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const db = await connectDB();
    const booking = await db.collection('bookings').findOne({ _id: new ObjectId(req.params.id) });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user_email !== req.user.email) return res.status(403).json({ error: 'Forbidden' });

    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'cancelled' } }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
