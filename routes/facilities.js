const express = require('express');
const { ObjectId } = require('mongodb');
const { connectDB } = require('../middleware/db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// GET all facilities (public) with search & filter
router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const { search, type } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (type && type !== 'all') {
      query.facility_type = { $in: [type] };
    }

    const facilities = await db.collection('facilities').find(query).toArray();
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single facility (public)
router.get('/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const facility = await db.collection('facilities').findOne({ _id: new ObjectId(req.params.id) });
    if (!facility) return res.status(404).json({ error: 'Facility not found' });
    res.json(facility);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add facility (private)
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = await connectDB();
    const facility = {
      ...req.body,
      owner_email: req.user.email,
      booking_count: 0,
      createdAt: new Date()
    };
    const result = await db.collection('facilities').insertOne(facility);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update facility (private - owner only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = await connectDB();
    const facility = await db.collection('facilities').findOne({ _id: new ObjectId(req.params.id) });
    if (!facility) return res.status(404).json({ error: 'Facility not found' });
    if (facility.owner_email !== req.user.email) return res.status(403).json({ error: 'Forbidden' });

    const { _id, ...updateData } = req.body;
    const result = await db.collection('facilities').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE facility (private - owner only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = await connectDB();
    const facility = await db.collection('facilities').findOne({ _id: new ObjectId(req.params.id) });
    if (!facility) return res.status(404).json({ error: 'Facility not found' });
    if (facility.owner_email !== req.user.email) return res.status(403).json({ error: 'Forbidden' });

    const result = await db.collection('facilities').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET my facilities (private)
router.get('/my/facilities', verifyToken, async (req, res) => {
  try {
    const db = await connectDB();
    const facilities = await db.collection('facilities').find({ owner_email: req.user.email }).toArray();
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
