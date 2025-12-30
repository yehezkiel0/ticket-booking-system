const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const { z } = require("zod");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-payment-2024";

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate LimitingConfiguration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

const users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@gmail.com",
    password: "$2a$10$0q9hh1hwZhsZ/BmY9eBtxuPs1buOQaNclEpMz4wUNRWuOO0iXEgym", // hashed "admin1234"
  },
];

const db = {
  query: async (sql, params) => {
    console.log(`[DB] Executing: ${sql} with params: ${params}`);
    if (sql.includes("WHERE id = $1")) {
      return { rows: users.filter((u) => u.id == params[0]) };
    }
    return { rows: [] };
  },
};

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

app.post("/api/users/register", async (req, res) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { name, email, password } = validation.data;

  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1000,
    name,
    email,
    password: hashedPassword,
  };

  users.push(newUser);

  res.status(201).json({
    message: "User registered successfully",
    data: { name, email },
  });
});

// Login Endpoint
app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Generate JWT Token
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    message: "Login successful",
    user: userWithoutPassword,
    token: token,
  });
});

// Fetch User by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Valid User ID is required" });
    }

    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
