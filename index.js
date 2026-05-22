const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://assigment9-meaw1.vercel.app',
    'https://assigment9-lb7tnx0dl-meaw1.vercel.app',
    'https://assigment9-theta.vercel.app'
  ],
  credentials: true
}));

// ঠিক এখানে এই জাদুর লাইনটি বসান
app.use(express.json());

// ঠিক এখানে এই জাদুর লাইনটি বসান
app.use(express.json());


const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let cachedDb = null;
async function getDatabase() {
  if (cachedDb) return cachedDb;
  await client.connect();
  cachedDb = client.db('sportnestDB');
  return cachedDb;
}

// Custom JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
 
  const token = req.cookies?.token || (authHeader ? authHeader.split(' ')[1] : null);
  
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized Access: No Token Provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access: Invalid Token' });
    }
    req.user = decoded; 
    next();
  });
};


app.post('/api/auth/jwt', async (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.send({ success: true, token });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.post('/api/facilities', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const facility = { ...req.body, booking_count: 0, createdAt: new Date() };
    const result = await db.collection('facilities').insertOne(facility);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error adding facility" });
  }
});


app.get('/api/facilities', async (req, res) => {
  try {
    const db = await getDatabase();
    const { search, type } = req.query;
    let query = {};
    
    if (search) query.name = { $regex: search, $options: 'i' };
    if (type && type !== 'all') query.facility_type = type;

    const result = await db.collection('facilities').find(query).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching facilities" });
  }
});


app.get('/api/facilities/my/facilities', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const email = req.query.email;
    
   
    if (req.user.email !== email) {
      return res.status(403).send({ message: 'Forbidden Access' });
    }
    
    const result = await db.collection('facilities').find({ owner_email: email }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching my facilities" });
  }
});


app.get('/api/facilities/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const result = await db.collection('facilities').findOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error fetching facility details" });
  }
});


app.put('/api/facilities/:id', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const { _id, ...updateData } = req.body;
    const result = await db.collection('facilities').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error updating facility" });
  }
});


app.delete('/api/facilities/:id', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const result = await db.collection('facilities').deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error deleting facility" });
  }
});




app.post('/api/bookings', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const booking = { ...req.body, status: 'pending', createdAt: new Date() };
    const result = await db.collection('bookings').insertOne(booking);

  
    if (booking.facility_id) {
      await db.collection('facilities').updateOne(
        { _id: new ObjectId(booking.facility_id) },
        { $inc: { booking_count: 1 } }
      );
    }
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Error creating booking" });
  }
});

// Get My Bookings (Private)
app.get('/api/bookings/my', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const email = req.query.email || req.user.email;

    if (req.user.email !== email) {
       return res.status(403).send({ message: 'Forbidden Access' });
    }

    const bookings = await db.collection('bookings')
      .find({ user_email: email })
      .sort({ createdAt: -1 })
      .toArray();
    res.send(bookings);
  } catch (error) {
    res.status(500).send({ message: "Error fetching bookings" });
  }
});

// Cancel a Booking (Private)
app.patch('/api/bookings/:id/cancel', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'cancelled' } }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Error cancelling booking" });
  }
});

// Basic Route
app.get('/', (req, res) => {
  res.send('SportNest Server is running Perfectly!');
});

// Server Initialization (DB কানেকশন কনফার্ম হওয়ার পরেই সার্ভার রানিং হবে)
getDatabase().then(() => {
  app.listen(port, () => {
    console.log(`✅ Successfully connected to MongoDB!`);
    console.log(`🚀 SportNest server running on port ${port}`);
  });
}).catch(console.dir);