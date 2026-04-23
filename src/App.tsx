import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./styles.css";

import hello from "./assets/Hello.gif";
import thinking1 from "./assets/thinking_1.gif";
import thinking2 from "./assets/thinking_2.gif";
import thinking3 from "./assets/thinking_3.gif";
import answer1 from "./assets/answer_1.gif";
import answer2 from "./assets/answer_2.gif";
import errorGif from "./assets/error.gif";
import ohYou from "./assets/oh_you.gif";
import pissOff from "./assets/piss_off.gif";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  mood?: keyof typeof moodMap;
  icon?: string;
  sources?: string[];
};

const moodMap = {
  hello,
  thinking: () => pick([thinking1, thinking2, thinking3]),
  answer: () => pick([answer1, answer2, ohYou]),
  error: errorGif,
  playful: ohYou,
  annoyed: () => pick([pissOff, errorGif]),
};

const bannedWords = [
  "fuck", "fucking", "fucker",
  "shit", "shitty",
  "bitch", "bastard",
  "asshole", "asshat",
  "dick", "douche", "douchebag",
  "cunt",
  "piss",
  "slut", "whore",
  "damn", "goddamn",
  "twat",
  "wanker",
  "jerk",
  "moron", "idiot", "dumbass",
  "retard", "retarded",
  "scumbag",
  "piece of shit",
  "mf", "mfer", "motherfucker"
];

function containsProfanity(text = "") {
  const t = text.toLowerCase();

  return bannedWords.some((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, "i");
    return pattern.test(t);
  });
}

export default function App() {
    const [messages, setMessages] = useState<Message[]>([
      {
        id: 1,
        text: "Hello! 👋",
        sender: "bot",
        mood: "hello",
        icon: moodMap.hello,
      },
    ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input;


    if (containsProfanity(text)) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text, sender: "user" },
        {
          id: Date.now() + 1,
          text: "🖕 No profanity",
          sender: "bot",
          mood: "annoyed",
          icon: moodMap.annoyed(),
        },
      ]);

      setInput("");
      return; 
    }

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text, sender: "user" },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `http://3.82.9.217:8000/query?q=${encodeURIComponent(text)}`
      );

      const data = await res.json();

      const botText =
        typeof data?.answer === "string"
          ? data.answer
          : data?.answer?.answer || "No response";

      const mood = "answer";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: botText,
          sender: "bot",
          sources: data?.answer?.sources || [],
          mood,
          icon: moodMap[mood] instanceof Function ? moodMap[mood]() : moodMap[mood],  
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `Error contacting backend 😢 ${err}`,
          sender: "bot",
          mood: "error",
          icon: moodMap.error,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="app-bg">
      <div className="chat-card">
        <div className="chat-header">
          <div className="title">Konrad's Rust Bot</div>
        </div>

        <div className="chat-box">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`bubble ${msg.sender === "user" ? "user" : "bot"}`}
            >
              {msg.sender === "bot" && (
              <img
                src={msg.icon || moodMap.answer()}
                className="bot-icon"
                alt="mood"
              />
              )}

              <div className="message-text">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
              </div>

              {/* sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="sources-row">
                  {msg.sources.map((s, i) => (
                    <a
                      key={i}
                      href={s}
                      target="_blank"
                      rel="noreferrer"
                      className="source-badge"
                    >
                      {new URL(s).hostname.replace("www.", "")}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="bubble bot">
              <img src={moodMap.thinking()} className="bot-icon" />
              <div className="message-text">Thinking...</div>
            </div>
          )}
        </div>

        <div className="input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? "..." : "Send"}
            
          </button>
          
        </div>
        <div className="title">This app is a WIP. It doesn't have any memory yet. And it is agressive on blocking requests</div>
      </div>
    </div>
  );
}