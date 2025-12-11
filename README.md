# Ticket Booking System (Microservices)

A scalable concert ticket booking platform built with a Microservices architecture.

## Architecture Overview

The system is designed to handle high concurrency and modular development. It consists of 4 independent services and a Frontend application.

### Services

1.  **Gateway Service** (`services/gateway`) - **Port 3000**

    - **Role**: API Gateway & Reverse Proxy.
    - **Function**: Acts as the single entry point for all client requests, routing them to the appropriate microservice. It handles load balancing routing logic.

2.  **User Service** (`services/user-service`) - **Port 3001**

    - **Role**: Identity & Access Management.
    - **Key Features**:
      - Secure Authentication & Registration (BCrypt hashing).
      - **Security**: Implements Rate Limiting (DoS protection), Helmet (Secure Headers), and Input Validation (Zod).

3.  **Booking Service** (`services/booking-service`) - **Port 3002**

    - **Role**: Concert Management & Booking Logic.
    - **Key Features**:
      - Product Catalog & Inventory.
      - **Performance**: Implements **Redis Cache-Aside Pattern** for high-traffic endpoints (`/api/products/popular`) to reduce database load.

4.  **Payment Service** (`services/payment-service`) - **Port 3003**

    - **Role**: Payment Processing.
    - **Function**: Handles asynchronous payment processing simulations.

5.  **Client** (`client`) - **Port 5173**
    - **Tech**: React.js, Vite, TailwindCSS.
    - **Structure**: Modular Service Layer (`client/src/services`), Pages (`/pages`), Components (`/components`).
    - **Optimization**: Code Splitting (`React.lazy`) and Pagination.

## Project Structure

```bash
ticket-booking-system/
├── client/                 # React Frontend Application
│   ├── src/services/       # API Service Layer (Refactored)
│   ├── src/pages/          # Login, Register, Dashboard
│   └── src/components/     # Navbar, Modals
├── services/               # Backend Microservices
│   ├── gateway/            # Entry point
│   ├── user-service/       # Auth API
│   ├── booking-service/    # Booking API with Redis
│   └── payment-service/    # Payment API
└── package.json            # Monorepo Orchestration
```

## How to Run

1.  **Install Dependencies**:

    ```bash
    npm run install:all
    ```

2.  **Start System** (Concurrent execution):
    ```bash
    npm start
    ```
    - **Frontend**: http://localhost:5173
    - **Gateway**: http://localhost:3000
