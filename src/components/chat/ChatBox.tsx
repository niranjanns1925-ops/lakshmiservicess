import { useState, useEffect } from "react";
import { Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSocket } from "@/hooks/useSocket";
import axios from "axios";

interface Message {
  id: string;
  senderId: string;
  sender: { fullName: string; role: string };
  content: string;
  createdAt: string;
}

export function ChatBox({ requisitionId, currentUserId }: { requisitionId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const socket = useSocket(requisitionId);

  // Fetch initial history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/requisitions/${requisitionId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    fetchMessages();
  }, [requisitionId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    
    socket.on("new_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("new_message");
    };
  }, [socket]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const res = await axios.post(`/api/requisitions/${requisitionId}/messages`, {
        senderId: currentUserId,
        content: inputValue
      });
      // The backend saves it. We can optionally wait for the WS broadcast, or manually append it.
      // E.g., emitting via socket
      socket?.emit("send_message", { ...res.data, requisitionId });
      setInputValue("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden bg-background">
      <div className="p-3 border-b bg-muted/50 font-medium">
        Requisition Chat
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex max-w-[80%] ${isMe ? "ml-auto" : "mr-auto"} gap-2`}>
                {!isMe && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {msg.sender.fullName || "Unknown"}
                  </div>
                  <div className={`px-3 py-2 rounded-lg text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-3 border-t bg-muted/20 flex gap-2">
        <Input 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button size="icon" type="submit" disabled={!inputValue.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
