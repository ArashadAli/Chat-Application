import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle
} from "@/components/ui/dialog"

import ChatRequestItem from "./ChatRequestItem"

export default function ChatRequestModal({
 open,
 setOpen,
 requests,
 acceptRequest,
 rejectRequest
}:any){

 return(
  <Dialog open={open} onOpenChange={setOpen}>

    <DialogContent>

      <DialogHeader>
        <DialogTitle>Chat Requests</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">

        {requests.map((req:any)=>(
          <ChatRequestItem
            key={req._id}
            request={req}
            acceptRequest={acceptRequest}
            rejectRequest={rejectRequest}
          />
        ))}

      </div>

    </DialogContent>

  </Dialog>
 )
}