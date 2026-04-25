import mongoose from "mongoose";

const dbConnection = async () => {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
        console.error("❌ MONGODB_URI is not defined in environment variables");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, {
            dbName: "chat-application",
        });
        
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ DB Connection Error:", error);
        process.exit(1); 
    }
};

export default dbConnection;