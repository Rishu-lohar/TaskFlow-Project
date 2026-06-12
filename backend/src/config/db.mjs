import mongoose from "mongoose";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI,
      {
        family: 4
      }
    );

    console.log(
      `MongoDB Connected: ${conn.connection.host}`
    );
  } catch (error) {
    console.error(
      `MongoDB Error: ${error.message}`
    );
    process.exit(1);
  }
};

export default connectDB;