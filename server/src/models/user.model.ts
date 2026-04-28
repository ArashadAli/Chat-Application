import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  phoneNo: string;
  username: string;
  password: string;
  profilePic?: string;
  profilePicPublicId?: string;
  quote?: string;
  isOnline: boolean;
  lastSeen?: Date;
  refreshToken?: string;
}

const userSchema = new Schema<IUser>(
  {
    phoneNo: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    profilePicPublicId: {
      type: String,
      default: "",
    },
    quote: {
      type: String,
      default: "Hey there! I am using ChatMet.",
      maxlength: 139,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);