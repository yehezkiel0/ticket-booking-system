const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Redis Client Configuration
const mockRedis = new Map();

const redisClient = {
  get: async (key) => {
    console.log(`[Cache] Checking key: ${key}`);
    const data = mockRedis.get(key);
    if (data) {
      if (data.expiry > Date.now()) {
        return data.value;
      } else {
        console.log(`[Cache] Key expired: ${key}`);
        mockRedis.delete(key);
      }
    }
    return null;
  },
  setex: async (key, seconds, value) => {
    console.log(`[Cache] Setting key: ${key} with TTL ${seconds}s`);
    mockRedis.set(key, {
      value,
      expiry: Date.now() + seconds * 1000,
    });
  },
};

// Database Data
const concerts = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Concert Event #${i + 1} - ${
    ["Jakarta", "Bandung", "Bali", "Surabaya"][i % 4]
  }`,
  price: (Math.floor(Math.random() * 10) + 1) * 100000,
  seats: Math.floor(Math.random() * 5000) + 100, // Min 100 seats
  popularity: Math.floor(Math.random() * 1000),
}));

// Bookings Storage (in-memory)
const bookings = [];
const bookingLocks = new Set(); // Prevent race condition

// Helper to retrieve popular products
const getPopularConcerts = () => {
  return [...concerts].sort((a, b) => b.popularity - a.popularity).slice(0, 50);
};

// Helper to generate unique booking ID
const generateBookingId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `BK-${timestamp}-${random}`;
};

// --- Routes ---

// List All Bookings
app.get("/api/bookings", (req, res) => {
  res.json({
    success: true,
    total: bookings.length,
    bookings: bookings,
  });
});

// Get Popular Products
app.get("/api/products/popular", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const cacheKey = `popular_concerts_p${page}_l${limit}`;

  // 1. Check Cache
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    console.log(`[API] Cache HIT for key: ${cacheKey}`);
    const parsedData = JSON.parse(cachedData);
    if (parsedData.meta) {
      parsedData.meta.cacheStatus = "HIT";
    }
    res.setHeader("X-Cache-Status", "HIT");
    return res.json(parsedData);
  }

  console.log(`[API] Cache MISS - Querying Database for page ${page}...`);

  // 2. Pagination
  const allPopular = getPopularConcerts();
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedData = allPopular.slice(startIndex, endIndex);

  const response = {
    data: paginatedData,
    meta: {
      page,
      limit,
      total: allPopular.length,
      totalPages: Math.ceil(allPopular.length / limit),
      cacheStatus: "MISS",
    },
  };

  // 3. Write to Cache (TTL 60 seconds)
  await redisClient.setex(cacheKey, 60, JSON.stringify(response));

  res.setHeader("X-Cache-Status", "MISS");
  res.json(response);
});

// Create Booking
app.post("/api/bookings", async (req, res) => {
  const { eventId, seatCount, userId } = req.body;

  if (!eventId || !seatCount) {
    return res.status(400).json({
      success: false,
      message: "eventId and seatCount are required",
    });
  }

  if (seatCount <= 0) {
    return res.status(400).json({
      success: false,
      message: "seatCount must be greater than 0",
    });
  }

  const concert = concerts.find((c) => c.id === parseInt(eventId));
  if (!concert) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  const lockKey = `event_${eventId}`;
  if (bookingLocks.has(lockKey)) {
    return res.status(409).json({
      success: false,
      message:
        "Another booking is in progress for this event. Please try again.",
    });
  }

  try {
    bookingLocks.add(lockKey);

    if (concert.seats < seatCount) {
      return res.status(400).json({
        success: false,
        message: `Only ${concert.seats} seats available`,
      });
    }

    // Generate booking
    const bookingId = generateBookingId();
    const totalPrice = concert.price * seatCount;

    const newBooking = {
      bookingId,
      eventId: concert.id,
      eventName: concert.name,
      seatCount,
      totalPrice,
      userId: userId || "guest",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    concert.seats -= seatCount;
    bookings.push(newBooking);

    console.log(
      `[Booking] Created: ${bookingId} - ${seatCount} seats for ${concert.name}`
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: newBooking,
    });
  } finally {
    bookingLocks.delete(lockKey);
  }
});

// GET /api/bookings/:bookingId - Get Single Booking
app.get("/api/bookings/:bookingId", (req, res) => {
  const { bookingId } = req.params;
  const booking = bookings.find((b) => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  res.json(booking);
});

// PATCH /api/bookings/:bookingId - Update Booking Status
app.patch("/api/bookings/:bookingId", (req, res) => {
  const { bookingId } = req.params;
  const { status, paymentId } = req.body;

  const booking = bookings.find((b) => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  }

  // Update status
  if (status) {
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
  }

  // Attach payment ID
  if (paymentId) {
    booking.paymentId = paymentId;
  }

  console.log(`[Booking] Updated ${bookingId}: status=${status}`);

  res.json({
    success: true,
    message: "Booking updated successfully",
    booking,
  });
});

app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});
