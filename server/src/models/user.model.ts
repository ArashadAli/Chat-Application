import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  phoneNo: string;
  username: string;
  password: string;
  profilePic?: string;
  isOnline: boolean;
  lastSeen?: Date;
  refreshToken?: string
}

const userSchema = new Schema<IUser>(
  {
    phoneNo: {
      type: String,
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    profilePic: {
      type: String
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date
    },
    refreshToken: {
        type: String
    }
  },
  { timestamps: true }
);


export default mongoose.model<IUser>("User", userSchema);