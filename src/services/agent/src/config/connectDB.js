import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            process.env.MONGODB_URI,
         
        );

        console.log("MongoDB connected");

        return connection;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

export default connectDB;