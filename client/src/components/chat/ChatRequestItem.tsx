import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Props {
  request: any
  acceptRequest: (id: string) => void
  rejectRequest: (id: string) => void
}

export default function ChatRequestItem({
  request,
  acceptRequest,
  rejectRequest
}: Props) {
  const sender = request.senderId

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted">

      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>
            {sender.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <span className="text-sm font-medium">
          {sender.username}
        </span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => acceptRequest(request._id)}>
          Accept
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => rejectRequest(request._id)}
        >
          Reject
        </Button>
      </div>

    </div>
  )
}