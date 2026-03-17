import { Button } from "@/components/ui/button"
import { Avatar,AvatarFallback } from "@/components/ui/avatar"

interface Props{
 user:any
 onConnect:()=>void
}

export default function SearchUserResult({user,onConnect}:Props){

 return(
  <div className="flex items-center justify-between p-3 rounded-xl bg-muted">

    <div className="flex items-center gap-2">

      <Avatar>
        <AvatarFallback>
          {user.username.slice(0,2)}
        </AvatarFallback>
      </Avatar>

      <div className="text-sm font-medium">
        {user.username}
      </div>

    </div>

    <Button size="sm" onClick={onConnect}>
      Connect
    </Button>

  </div>
 )
}