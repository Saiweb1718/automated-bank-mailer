import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import transactionsRoutes from "./routes/transactions.routes.js";
import customersRoutes from "./routes/customers.routes.js";
import emailRoutes from "./routes/email.routes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORGIN || '*',
  credentials: true
}));

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Banking Email System is running',
    timestamp: new Date().toISOString()
  });
});

const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/transactions`, transactionsRoutes);
app.use(`${API_PREFIX}/customers`, customersRoutes);
app.use(`${API_PREFIX}/emails`, emailRoutes);

app.use(errorHandler);

export default app;