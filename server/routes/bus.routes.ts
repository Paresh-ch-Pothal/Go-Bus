import express from "express";
import busController from '../controllers/bus.controller';
import fetchuser from "../middleware/fetchuser";

const router = express.Router();


router.post("/addBus", fetchuser, busController.addBus);
router.post("/bookBus/:id", fetchuser, busController.bookABus);
router.post("/searchBus", busController.searchBus);
router.post("/getStatusForBooked/:id", busController.getBusDetails);

export default router;
