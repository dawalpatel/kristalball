const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const transferRoutes = require('./routes/transferRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const expenditureRoutes = require('./routes/expenditureRoutes');
const userRoutes = require('./routes/userRoutes');
const baseRoutes = require('./routes/baseRoutes');
const equipmentTypeRoutes = require('./routes/equipmentTypeRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const { sendError } = require('./utils/response');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bases', baseRoutes);
app.use('/api/equipment-types', equipmentTypeRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// 404 Handler
app.use((req, res) => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return sendError(res, message, statusCode);
});

module.exports = app;
