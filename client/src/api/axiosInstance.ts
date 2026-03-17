import axios from "axios"
import { toast } from "react-hot-toast"

const baseAPIURL = import.meta.env.VITE_BACKEND_BASE_URL

const axiosInstance = axios.create({
  baseURL: baseAPIURL,
  withCredentials: true
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || "Something went wrong"

    toast.error(message)

    return Promise.reject(error)
  }
)

export default axiosInstance