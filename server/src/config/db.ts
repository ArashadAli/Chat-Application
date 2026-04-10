import mongoose from "mongoose";

const dbConnection = async () => {
    // Check if URI exists to avoid cryptic errors
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
        console.error("❌ MONGODB_URI is not defined in environment variables");
        process.exit(1);
    }

    try {
        // Pass the DB name as an option instead of string math
        await mongoose.connect(uri, {
            dbName: "chat-application",
        });
        
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ DB Connection Error:", error);
        // In production, you might want to notify an error tracking service here
        process.exit(1); 
    }
};

export default dbConnection;