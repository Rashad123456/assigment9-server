# SportNest - Server Side

The backend API for the SportNest platform, built with Node.js, Express, and MongoDB.

## Features
- **RESTful API:** Efficient endpoints for managing facilities and bookings.
- **Database:** Used MongoDB for scalable data storage.
- **Security:** Secure data handling and API protection.
- **Integration:** Seamlessly connects with the SportNest client application.

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Mongoose
- Cors & Dotenv

## API Endpoints
- `GET /facilities` - Fetch all sports facilities.
- `POST /bookings` - Securely book a facility.
- `GET /bookings/:email` - Fetch bookings for a specific user.

## How to Run
1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Configure your `.env` file with `MONGODB_URI` and `JWT_SECRET`.
4. Run `npm start` or `nodemon index.js` to start the server.
