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
    if (data && data.expiry > Date.now()) {
      return data.value;
    }
    return null; // Cache miss or expired
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
  seats: Math.floor(Math.random() * 5000),
  popularity: Math.floor(Math.random() * 1000), // For sorting popular
}));

// Helper to retrieve popular products
const getPopularConcerts = () => {
  return [...concerts].sort((a, b) => b.popularity - a.popularity).slice(0, 50);
};

// --- Routes ---

// List All Bookings (stub)
app.get("/api/bookings", (req, res) => {
  res.json({ message: "List of bookings (empty)" });
});

// Get Popular Products (Cached with Pagination)
app.get("/api/products/popular", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const cacheKey = `popular_concerts_p${page}_l${limit}`;

  // 1. Check Cache
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    console.log(`[API] Cache HIT for key: ${cacheKey}`);
    return res.json(JSON.parse(cachedData));
  }

  console.log(`[API] Cache MISS - Querying Database for page ${page}...`);

  // 2. Simulate Pagination
  const allPopular = getPopularConcerts(); // Returns 50 items
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
    },
  };

  // 3. Write to Cache (TTL 60 seconds)
  await redisClient.setex(cacheKey, 60, JSON.stringify(response));

  res.json(response);
});

app.post("/api/bookings", (req, res) => {
  // Logic for booking ticket
  // Publish event to Message Queue
  console.log("[Event] Booking Created -> Publish to Queue");
  res.json({ message: "Booking pending payment", bookingId: "Order-123" });
});

app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});
