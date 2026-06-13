import express from "express";
import { getNotes, createNote, updateNote, deleteNote } from "../controllers/noteController.mjs";
import protect from "../middleware/authMiddleware.mjs";

const router = express.Router();

router.use(protect);

router.get("/", getNotes);
router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;
