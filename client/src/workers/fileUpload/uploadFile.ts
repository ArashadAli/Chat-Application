import axiosInstance from "../../api/axiosInstance";
import axios from "axios";

export interface UploadFileResponse {
  success: boolean;
  message: any;
}

async function getPresignedUploadUrl(
  conversationId: string,
  file: File
): Promise<{ presignedUrl: string; s3Key: string; uniqueFileName: string; messageType: string }> {
  const res = await axiosInstance.get("/user/presigned-upload-url", {
    params: {
      fileName: file.name,
      mimeType: file.type,
      conversationId,
    },
  });
  return res.data;
}

async function uploadToS3(
  presignedUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
    onUploadProgress: (event) => {
      if (event.total) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      }
    },
  });
}

async function saveFileMessage(
  conversationId: string,
  file: File,
  s3Key: string,
  uniqueFileName: string,
  messageType: string
): Promise<UploadFileResponse> {
  const res = await axiosInstance.post(
    `/user/conversation/${conversationId}/save-file-message`,
    {
      originalName: file.name,
      uniqueFileName,
      mimeType: file.type,
      size: file.size,
      messageType,
      s3Key,
    }
  );
  return res.data;
}

export async function uploadFileWorker(
  conversationId: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadFileResponse> {

  // Step 1 — Backend se presigned URL lo
  onProgress(0);
  const { presignedUrl, s3Key, uniqueFileName, messageType } =
    await getPresignedUploadUrl(conversationId, file);

  // Step 2 — Directly S3 pe upload karo with progress
  await uploadToS3(presignedUrl, file, onProgress);

  // Step 3 — DB mein message save karo
  const result = await saveFileMessage(
    conversationId,
    file,
    s3Key,
    uniqueFileName,
    messageType
  );

  onProgress(100);
  return result;
}

// ── Download: Get presigned URL then fetch with progress ─────────────────────
export async function downloadFileWorker(
  fileName: string,
  originalName: string,
  onProgress: (percent: number) => void
): Promise<void> {

  // Step 1 — Backend se presigned GET URL lo
  const { data } = await axiosInstance.get(`/user/files/${fileName}`);
  const presignedUrl: string = data.presignedUrl;

  // Step 2 — Presigned URL se directly S3 se download karo with progress
  const response = await fetch(presignedUrl);
  if (!response.ok) throw new Error("Download failed");

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Stream not available");

  const chunks: ArrayBuffer[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value.buffer as ArrayBuffer);
    received += value.length;
    if (total > 0) {
      onProgress(Math.round((received * 100) / total));
    }
  }

  // Step 3 — Blob banao aur download trigger karo
  const blob = new Blob(chunks);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

  onProgress(100);
}

// ── Get presigned URL for image preview/viewing ───────────────────────────────
export async function getFileViewUrl(fileName: string): Promise<string> {
  const { data } = await axiosInstance.get(`/user/files/${fileName}`);
  return data.presignedUrl;
}