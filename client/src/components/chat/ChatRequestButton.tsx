import { Bell } from "lucide-react"

interface Props {
  count: number
  onClick: () => void
}

export default function ChatRequestButton({ count, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-xl hover:bg-muted transition"
    >
      <Bell className="w-4 h-4 text-muted-foreground" />

      {count > 0 && (
        <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white px-1.5 py-[1px] rounded-full">
          {count}
        </span>
      )}
    </button>
  )
}