const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Health Check
app.get("/", (req, res) => {
  res.send("API Gateway is running");
});

// Proxy Rules
const routes = {
  "/api/users": "http://localhost:3001",
  "/api/auth": "http://localhost:3001",
  "/api/bookings": "http://localhost:3002",
  "/api/products": "http://localhost:3002",
  "/api/payments": "http://localhost:3003",
};

for (const [route, target] of Object.entries(routes)) {
  app.use(
    route,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${route}`]: route,
      },
    })
  );
}

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
