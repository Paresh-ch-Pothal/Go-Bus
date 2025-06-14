import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { AuthenticatedUser } from "../middleware/fetchuser";

interface AuthenticatedRequest extends Request {
    user: {
        _id: string,
        role: string,
        name: string
    }
}


const signupUser = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        res.status(400).json({ message: "Please fill all the fields", success: false });
    }

    try {
        const existUser = await User.findOne({ email });
        if (existUser) {
            res.status(400).json({ message: "User already exists", success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
        });

        const payload = {
            user: {
                _id: newUser._id,
                role: newUser.role,
                name: newUser.name,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET!);

        res.status(201).json({ message: "User created successfully", success: true, token, newUser });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error", success: false });

    }
};


const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        res.status(400).json({ message: "Please fill all the fields", success: false });
    }

    try {
        const user: any = await User.findOne({ email: email, role: role });
        if (!user) {
            res.status(400).json({ message: "Invalid Credentials", success: false });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid Credentials", success: false });
        }
        const payload = {
            user: {
                _id: user?._id,
                role: user?.role,
                name: user?.name,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET!);

        res.status(201).json({ message: "User created successfully", success: true, token, user });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error", success: false });
    }
};



// fetching all the buses booked by a particular user
const fetchBookedBus = async (req: Request, res: Response): Promise<void> => {
    try {
        const userAuth = (req as Request & { user: AuthenticatedUser }).user
        const userId = userAuth._id;
        if (!userId) {
            res.status(400).json({ message: "Please Login to view your booked buses", success: false })
        }
        const user = await User.findById(userId)
            .populate("bookedBus.busId")
            .populate("bookedBus.paymentDetails");
        res.status(200).json({ message: "Fetched all the booked buses", success: true, user })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error", success: false })
    }
}

// fetching all the buses added by a particular user
const fetchAddedBus = async (req: Request, res: Response): Promise<void> => {
    try {
        const userAuth = (req as Request & { user: AuthenticatedUser }).user
        const userId = userAuth._id;
        
        if (!userId) {
             res.status(400).json({ message: "Please Login to view your added Buses", success: false })
        }
        if (userAuth.role !== "admin") {
             res.status(400).json({ message: "You are not authorized to view this resource", success: false })
        }
        const user = await User.findById(userId).populate("addedBus")
         res.status(200).json({ message: "Fetched all the added buses", success: true, user })
    } catch (error) {
        console.log(error)
         res.status(500).json({ message: "Internal Server Error", success: false })
    }
}

export default { signupUser, loginUser, fetchBookedBus, fetchAddedBus }


