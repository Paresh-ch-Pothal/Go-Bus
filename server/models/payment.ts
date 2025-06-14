import mongoose, { mongo, Schema } from "mongoose";
import { Document } from "mongoose";

export enum PaymentStatus {
  Pending = "pending",
  Completed = "completed",
  Failed = "failed"
}

export enum PaymentMethod {
  UPI = "upi",
  Card = "card",
  Netbanking = "netbanking",
  Wallet = 'wallet',
  Cash = 'cash'

}

interface payment extends Document {
  user: mongoose.Types.ObjectId,
  bus: mongoose.Types.ObjectId,
  seatsBooked: number[],
  amount: number,
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}



const paymentSchema: Schema<payment> = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "bus",
    required: true,
  },
  seatsBooked: {
    type: [Number],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus)
  },

  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod)
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
})


const Payment = mongoose.model<payment>("payment", paymentSchema);
export default Payment;