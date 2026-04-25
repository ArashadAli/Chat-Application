import dotenv from 'dotenv'
import { S3Client } from "@aws-sdk/client-s3";

dotenv.config({
    path:'./.env'
})

console.log("s3 bucket name : ", process.env.S3_BUCKET_NAME)
 
export const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_BUCKET_ACCESSKEY!,
    secretAccessKey: process.env.AWS_BUCKET_SECRETACCESSKEY!,
  },
});



export const S3_BASE_URL = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com`;