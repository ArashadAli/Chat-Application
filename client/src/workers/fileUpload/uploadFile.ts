import axiosInstance from "../../api/axiosInstance";
 
export interface UploadFileResponse {
  success: boolean;
  message: any;
}
 
export async function uploadFileWorker(
  conversationId: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append("file", file);
 
  const res = await axiosInstance.post(
    `/user/conversation/${conversationId}/upload`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      },
    }
  );
 
  return res.data;
}
 

export async function downloadFileWorker(
  fileName: string,
  originalName: string,
  onProgress: (percent: number) => void
): Promise<void> {
  const res = await axiosInstance.get(`/user/files/${fileName}`, {
    responseType: "blob",
    onDownloadProgress: (event) => {
      if (event.total) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      }
    },
  });
 
  const blob = new Blob([res.data], { type: res.headers["content-type"] });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}