import Sidebar from "../components/chat/Sidebar";
import ChatArea from "../components/chat/ChatArea";

export default function ChatLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-neutral-900">
      {/* Sidebar — fixed width */}
      <div className="w-72 xl:w-80 shrink-0 flex flex-col h-full">
        <Sidebar />
      </div>

      {/* Chat area — fills remaining space */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <ChatArea />
      </div>
    </div>
  );
}