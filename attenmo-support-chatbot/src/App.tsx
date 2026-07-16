import React, { useState } from "react";
import { WidgetConfig } from "./types";
import ChatWidget from "./components/ChatWidget";

export default function App() {
  const [config] = useState<WidgetConfig>({
    theme: "light",
    primaryColor: "#667eea",
    accentColor: "#764ba2",
    headerTitle: "💜 AttenMo Support",
    position: "bottom-right",
    borderRadius: "rounded-none",
    welcomeMessage: "👋 Welcome to AttenMo Support! I can help with QR attendance, Google sign-in, class setup, location issues, pending approvals, and more. Are you a student or a CR/educator?"
  });

  return (
    <div className="w-screen h-screen overflow-hidden bg-white">
      <ChatWidget 
        config={config} 
        isOpenOnInit={true}
        inlineMode={true}
      />
    </div>
  );
}

