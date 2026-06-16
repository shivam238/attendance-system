export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  attachment?: {
    name: string;
    mimeType: string;
    base64: string; // raw base64 data without metadata scheme prefix
  };
}

export interface WidgetConfig {
  theme: "light" | "dark" | "system";
  primaryColor: string;
  accentColor: string;
  headerTitle: string;
  position: "bottom-right" | "bottom-left";
  borderRadius: "rounded-md" | "rounded-xl" | "rounded-3xl" | "rounded-full";
  welcomeMessage: string;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  prompt: string;
  roleType?: "student" | "cr_educator" | "unspecified";
}
