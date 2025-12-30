const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3003;
const GATEWAY_URL = "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-payment-2024";

app.use(cors());
app.use(express.json());

// JWT Middleware untuk Autentikasi
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
};

// Payment Storage (in-memory)
const payments = [];

// Helper: Generate Payment ID
const generatePaymentId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `PAY-${timestamp}-${random}`;
};

const processPaymentAsync = async (paymentId, bookingId, amount) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        console.log(
          `[Payment] ✓ Success: ${paymentId} for booking ${bookingId}`
        );

        // Update booking status ke "paid" di booking service
        try {
          await axios.patch(`${GATEWAY_URL}/api/bookings/${bookingId}`, {
            status: "paid",
            paymentId: paymentId,
          });
          console.log(`[Payment] → Booking ${bookingId} marked as PAID`);
        } catch (error) {
          console.error(
            `[Payment] ✗ Failed to update booking status:`,
            error.message
          );
        }

        resolve({ success: true, paymentId });
      } else {
        console.log(`[Payment] ✗ Failed: ${paymentId} - Payment declined`);
        reject(new Error("Payment declined by provider"));
      }
    }, 2000);
  });
};

// POST /api/payments - Process Payment (Protected)
app.post("/api/payments", authenticateToken, async (req, res) => {
  const { bookingId, amount } = req.body;

  // Validasi Input
  if (!bookingId || !amount) {
    return res.status(400).json({
      success: false,
      message: "bookingId and amount are required",
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "amount must be greater than 0",
    });
  }

  // Validasi Booking exists & belum dibayar
  try {
    const bookingResponse = await axios.get(
      `${GATEWAY_URL}/api/bookings/${bookingId}`
    );
    const booking = bookingResponse.data;

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking already paid",
      });
    }

    // Validasi Amount sesuai dengan totalPrice booking
    if (booking.totalPrice !== amount) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected: ${booking.totalPrice}, Got: ${amount}`,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to validate booking",
    });
  }

  // Generate Payment ID
  const paymentId = generatePaymentId();

  // Simpan payment dengan status "processing"
  const newPayment = {
    paymentId,
    bookingId,
    amount,
    status: "processing",
    createdAt: new Date().toISOString(),
  };
  payments.push(newPayment);

  console.log(
    `[Payment] Processing ${paymentId} for ${bookingId} (Rp ${amount})`
  );

  // Response langsung (non-blocking)
  res.json({
    success: true,
    paymentId,
    status: "processing",
    message: "Payment is being processed",
  });

  // Process payment async di background
  processPaymentAsync(paymentId, bookingId, amount)
    .then(() => {
      const payment = payments.find((p) => p.paymentId === paymentId);
      if (payment) {
        payment.status = "success";
        payment.completedAt = new Date().toISOString();
      }
    })
    .catch((error) => {
      const payment = payments.find((p) => p.paymentId === paymentId);
      if (payment) {
        payment.status = "failed";
        payment.failedAt = new Date().toISOString();
        payment.errorMessage = error.message;
      }
    });
});

// GET /api/payments/:paymentId - Check Payment Status (Protected)
app.get("/api/payments/:paymentId", authenticateToken, (req, res) => {
  const { paymentId } = req.params;
  const payment = payments.find((p) => p.paymentId === paymentId);

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  res.json({
    success: true,
    payment,
  });
});

// GET /api/payments - List All Payments (Protected)
app.get("/api/payments", authenticateToken, (req, res) => {
  res.json({
    success: true,
    total: payments.length,
    payments,
  });
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
