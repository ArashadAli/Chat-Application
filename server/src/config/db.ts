import mongoose from "mongoose";

const dbConnection = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(uri);

    console.log("Database connected successfully");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Database connection failed:", error.message);
    } else {
      console.error("Unknown database error:", error);
    }
    process.exit(1);
  }
};

export default dbConnection;