/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ChatBox } from "./components/chat/ChatBox";
import { CollabDocument } from "./components/chat/CollabDocument";

// Fake data for demo
const MOCK_REQUISITION_ID = "req-123";
const MOCK_USERS = [
  { id: "u1", name: "Alice (Admin)", role: "admin" },
  { id: "u2", name: "Bob (User)", role: "user" }
];

function DemoPage() {
  const [currentUser, setCurrentUser] = useState(MOCK_USERS[0]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    fetch("/api/seed-demo", { method: "POST" })
      .then(() => setSeeded(true))
      .catch((err) => console.error(err));
  }, []);

  if (!seeded) return <div className="p-8 text-center">Loading workspace...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col gap-8">
      <header className="flex justify-between items-center bg-muted/30 p-4 border rounded-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requisition #123 Workspace</h1>
          <p className="text-muted-foreground text-sm">Direct Messaging and Collaboration Demo</p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm">Logged in as:</span>
          <select 
            className="border p-2 rounded"
            value={currentUser.id}
            onChange={(e) => setCurrentUser(MOCK_USERS.find(u => u.id === e.target.value)!)}
          >
            {MOCK_USERS.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid md:grid-cols-[1fr_400px] gap-6">
        <div className="border rounded-lg p-6 flex flex-col gap-4 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold mb-1">Collaboration Notes</h2>
            <p className="text-sm text-muted-foreground mb-4">Edit document notes in real-time. Try opening this page in another browser window and switching users.</p>
          </div>
          <CollabDocument requisitionId={MOCK_REQUISITION_ID} currentUser={currentUser} />
        </div>
        
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Direct Messages</h2>
            <p className="text-sm text-muted-foreground">Chat securely regarding this requisition.</p>
          </div>
          <ChatBox requisitionId={MOCK_REQUISITION_ID} currentUserId={currentUser.id} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DemoPage />} />
      </Routes>
    </BrowserRouter>
  );
}
