import { Request, Response } from "express";
import Payment, { PaymentMethod, PaymentStatus } from "../models/payment";
import Bus from "../models/bus";
import User from "../models/user";
import { Cashfree, CFEnvironment } from "cashfree-pg";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;

const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    CASHFREE_APP_ID,
    CASHFREE_SECRET_KEY
);

const verifyPayment = async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.body;

    if (!orderId) {
        res.status(400).json({ success: false, message: "Order ID missing" });
    }

    try {
        const payment = await Payment.findOne({ transactionId: orderId });
        if (!payment) {
            res.status(404).json({ success: false, message: "Payment not found" });
        }

        // Already verified
        if (payment?.paymentStatus === "completed") {
            res.status(200).json({ success: true, message: "Payment already verified" });
        }

        const userId: any = payment?.user;
        const busId: any = payment?.bus;
        const seats = payment?.seatsBooked as number[];

        const bus = await Bus.findById(busId);
        const user = await User.findById(userId);
        if (!bus || !user) {
            res.status(404).json({ success: false, message: "User or Bus not found" });
        }

        // Check if these seats have already been booked for this payment
        const alreadyBookedInBus = bus?.bookedSeats.some(
            s => s.paymentDetails?.toString() === payment?._id?.toString()
        );

        const alreadyBookedInUser = user?.bookedBus.some(
            s => s.paymentDetails?.toString() === payment?._id?.toString()
        );

        if (!alreadyBookedInBus) {
            for (const seat of seats) {
                const paymentDetails: any = payment?._id
                bus?.bookedSeats.push({ seat, userId, paymentDetails });
            }
            await bus?.save();
        }

        if (!alreadyBookedInUser) {
            for (const seat of seats) {
                const paymentDetails: any = payment?._id
                user?.bookedBus.push({ busId, seat, paymentDetails });
            }
            await user?.save();
        }

        const response = await cashfree.PGOrderFetchPayments(orderId);
        const paymentInfo = response.data?.[0];
        if (!paymentInfo) {
            res.status(404).json({ success: false, message: "Payment info not found" });
        }

        if (paymentInfo.payment_status !== "SUCCESS") {
            res.json({ success: false, message: "Payment not successful" });
        }
        // const paymentId = payment?._id
        if (!payment) {
            res.status(404).json({ success: false, message: "Payment record not found" });
        }

        // const userId = payment.user;
        // const busId = payment.bus;
        // const seats = payment.seatsBooked as number[];

        // if (!userId || !busId || !seats || seats.length === 0) {
        //     return res.status(400).json({ success: false, message: "Invalid payment data" });
        // }

        // const bus = await Bus.findById(busId);
        // const user = await User.findById(userId);

        // if (!bus || !user) {
        //     return res.status(404).json({ success: false, message: "User or Bus not found" });
        // }

        // // Add booked seats to bus and user
        // for (const seat of seats) {
        //     bus.bookedSeats.push({ seat, userId, paymentDetails: paymentId });
        //     user.bookedBus.push({ busId, seat, paymentDetails: paymentId });
        // }

        // await bus.save()
        // await user.save()

        // await Promise.all([bus.save(), user.save()]);

        const paymethod: any = paymentInfo.payment_group
        payment!.paymentMethod = PaymentMethod[paymethod as keyof typeof PaymentMethod]; // safest way
        payment!.paymentStatus = PaymentStatus.Completed;
        await payment?.save();

        res.json({ success: true, message: "Payment successful" });
    } catch (error: any) {
        console.error("Cashfree API error:", error.response?.data || error.message || error);
        res.status(500).json({ success: false, message: "Error verifying payment" });
    }
};

export default { verifyPayment };
