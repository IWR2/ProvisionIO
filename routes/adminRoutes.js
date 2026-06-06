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

/**
 * POST /init - Creates the DynamoDB table.
 * Run this ONCE before using any other endpoints.
 */
router.post("/init", createTable);

/**
 * DELETE /init - Deletes the DynamoDB table and ALL its data.
 * Use with caution. This action cannot be undone.
 */
router.delete("/init", deleteTable);

export default router;
