import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

interface CollabUser {
  id: string;
  name: string;
  cursor?: number;
}

export function CollabDocument({ requisitionId, currentUser }: { requisitionId: string; currentUser: { id: string; name: string } }) {
  const socket = useSocket(requisitionId);
  const [content, setContent] = useState("");
  const [activeUsers, setActiveUsers] = useState<Record<string, CollabUser>>({});

  useEffect(() => {
    if (!socket) return;
    
    // Listen for peer updates
    socket.on("collab_update", (data) => {
      // Update content if from another user
      if (data.userId !== currentUser.id) {
        setContent(data.content);
        
        // Update active users
        setActiveUsers(prev => ({
          ...prev,
          [data.userId]: {
            id: data.userId,
            name: data.userName,
            cursor: data.cursor
          }
        }));
      }
    });

    return () => {
      socket.off("collab_update");
    };
  }, [socket, currentUser.id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (socket) {
      socket.emit("collab_update", {
        requisitionId,
        userId: currentUser.id,
        userName: currentUser.name,
        content: newContent,
        cursor: e.target.selectionStart
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Viewing right now:</span>
        {Object.values(activeUsers).map(user => (
          <Avatar key={user.id} className="w-8 h-8 border-2 border-primary" title={user.name}>
            <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ))}
        {Object.keys(activeUsers).length === 0 && (
          <span className="text-sm text-muted-foreground italic">Just you</span>
        )}
      </div>

      <div className="relative">
        <Textarea
          value={content}
          onChange={handleChange}
          className="min-h-[300px] resize-y p-4 font-mono text-sm leading-relaxed"
          placeholder="Collaborate on notes here..."
        />
        {/* We can potentially overlay simple cursors here but keeping it simpler for now */}
      </div>
    </div>
  );
}
