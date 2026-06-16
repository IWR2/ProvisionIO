/**
 * Admin Routes - Handles administrative operations.
 *
 * These endpoints are for table management during development.
 *
 * @module routes/adminRoutes
 */

import express from "express";
import { createTable, deleteTable } from "../controllers/adminController.js";

const router = express.Router();

// Creates the DynamoDB table
router.post("/", createTable);

// Deletes the DynamoDB table and ALL its data.
router.delete("/", deleteTable);

export default router;
