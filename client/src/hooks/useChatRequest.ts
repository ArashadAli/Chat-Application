import { useState } from "react"
import { getChatRequestsWorker } from "../workers/chat/getChatRequest"
import { acceptChatRequestWorker } from "../workers/chat/acceptChatRequest"

export default function useChatRequests(){

  const [requests,setRequests] = useState<any[]>([])
  const [open,setOpen] = useState(false)

  const fetchRequests = async ()=>{
    const data = await getChatRequestsWorker()
    setRequests(data)
  }

  const openModal = async ()=>{
    setOpen(true)
    fetchRequests()
  }

  const acceptRequest = async(id:string)=>{
    await acceptChatRequestWorker(id)
    setRequests(prev => prev.filter(r => r._id !== id))
  }

  const rejectRequest = (id:string)=>{
    setRequests(prev => prev.filter(r => r._id !== id))
  }

  return {
    open,
    setOpen,
    openModal,
    requests,
    acceptRequest,
    rejectRequest
  }
}