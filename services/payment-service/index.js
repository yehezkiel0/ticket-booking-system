const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.post("/api/payments", (req, res) => {
  const { bookingId, amount } = req.body;

  setTimeout(() => {
    console.log(`[Payment] Processing payment for ${bookingId} ($${amount})`);
    console.log(`[Event] Payment Success -> Booking Service`);
  }, 1000);

  res.json({ status: "Processing", message: "Payment is being processed" });
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
