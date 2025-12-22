"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Sparkles,
  Wand2,
  X,
  Zap,
  Phone,
  Clock,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";

type ChatView = "welcome" | "chat" | "details";

type ChatMessage = {
  id: string;
  sender: "user" | "agent";
  text: string;
  time: string;
};

const makeId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `id-${Math.random().toString(16).slice(2)}`;

const initialMessages: ChatMessage[] = [];

const quickQuestions = [
  "Hey, I want to subscribe to Spur.",
  "I want to book a demo call.",
  "What are your support hours?",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [view, setView] = useState<ChatView>("welcome");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState<string>("");
  const [hasAskedDetails, setHasAskedDetails] = useState<boolean>(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const headerTitle = useMemo(() => {
    if (view === "welcome") return "Spur Support";
    return "Spur Support";
  }, [view]);

  const headerIcon = useMemo(() => {
    if (view === "welcome") return <Sparkles className="h-5 w-5" />;
    return <MessageCircle className="h-5 w-5" />;
  }, [view]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messageListRef.current?.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const addMessages = (newMessages: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...newMessages]);
    scrollToBottom();
  };

  const simulateAgentReply = (prompt: string) => {
    const replyText = prompt.toLowerCase().includes("demo")
      ? "I can help with a demo. What time works best for you?"
      : prompt.toLowerCase().includes("subscribe")
        ? "Great! I can guide you through plans and pricing."
        : "Thanks for reaching out! Tell me a bit more and I'll help right away.";

    setTimeout(() => {
      addMessages([
        {
          id: makeId(),
          sender: "agent",
          text: replyText,
          time: "just now",
        },
      ]);
    }, 600);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    // Gate the very first message behind the details form
    if (messages.length === 0 && !hasAskedDetails) {
      setPendingMessage(userMessage);
      setView("details");
      return;
    }

    addMessages([
      {
        id: makeId(),
        sender: "user",
        text: userMessage,
        time: "just now",
      },
    ]);

    simulateAgentReply(userMessage);
  };

  const handleQuickQuestion = (question: string) => {
    setView("chat");
    setInput("");

    if (messages.length === 0 && !hasAskedDetails) {
      setPendingMessage(question);
      setView("details");
      return;
    }

    addMessages([
      {
        id: makeId(),
        sender: "user",
        text: question,
        time: "just now",
      },
    ]);

    simulateAgentReply(question);
  };

  const handleDetailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasAskedDetails(true);
    setView("chat");

    if (pendingMessage) {
      addMessages([
        {
          id: makeId(),
          sender: "user",
          text: pendingMessage,
          time: "just now",
        },
      ]);

      addMessages([
        {
          id: makeId(),
          sender: "agent",
          text: `Thanks ${details.name || "there"}! I've got your details.`,
          time: "just now",
        },
      ]);

      simulateAgentReply(pendingMessage);
      setPendingMessage(null);
    } else {
      addMessages([
        {
          id: makeId(),
          sender: "agent",
          text: `Thanks ${details.name || "there"}! I've got your details. How can I assist you further?`,
          time: "just now",
        },
      ]);
    }
  };

  const handleWhatsapp = () => {
    window.open("https://wa.me/", "_blank");
  };

  const renderWelcome = () => (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#1a73e8] via-[#1d82ff] to-[#0f5ad3] p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-white/80">Spur Support</p>
            <h2 className="text-2xl font-semibold leading-snug">
              Hey 👋, how can we help you today?
            </h2>
            <p className="text-sm text-white/80">
              We usually respond within 10 minutes
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Start a conversation</p>
          <p className="text-xs text-slate-500">We usually respond within 10 minutes</p>
          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#155ec2]"
            onClick={() => setView("chat")}
          >
            <span>Chat with us</span>
            <Zap className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleWhatsapp}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white/90 px-4 py-4 text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Chat with us on WhatsApp</p>
              <p className="text-xs text-slate-500">Fast lane support</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ask quick questions
        </p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => handleQuickQuestion(question)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex h-[420px] flex-col">
      <div
        className="thin-scrollbar flex-1 space-y-4 overflow-y-auto pr-1"
        ref={messageListRef}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`${
                message.sender === "user"
                  ? "bg-[#1a73e8] text-white"
                  : "bg-slate-100 text-slate-800"
              } max-w-[80%] rounded-2xl px-4 py-3 shadow-sm animate-fade-up`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p
                className={`mt-1 text-[11px] ${
                  message.sender === "user"
                    ? "text-white/80"
                    : "text-slate-500"
                }`}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            rows={1}
            className="min-h-[44px] flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none"
          />
          <button
            onClick={handleSend}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a73e8] text-white shadow-md transition hover:bg-[#155ec2] disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetails = () => (
    <form className="space-y-4" onSubmit={handleDetailSubmit}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Please share your details so we can assist you better:
        </p>
        {pendingMessage ? (
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending message</p>
            <p className="mt-1">“{pendingMessage}”</p>
          </div>
        ) : null}
        <input
          type="text"
          placeholder="Your Name"
          value={details.name}
          onChange={(event) => setDetails({ ...details, name: event.target.value })}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100"
        />
        <input
          type="email"
          placeholder="Your Email"
          value={details.email}
          onChange={(event) => setDetails({ ...details, email: event.target.value })}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100"
        />
        <input
          type="tel"
          placeholder="Your Phone Number"
          value={details.phone}
          onChange={(event) => setDetails({ ...details, phone: event.target.value })}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        We'll use these details to contact you if we get disconnected.
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            setHasAskedDetails(true);
            setView("chat");
            if (pendingMessage) {
              addMessages([
                {
                  id: makeId(),
                  sender: "user",
                  text: pendingMessage,
                  time: "just now",
                },
              ]);
              simulateAgentReply(pendingMessage);
              setPendingMessage(null);
            }
          }}
          className="text-sm font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-900"
        >
          Skip for now
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#155ec2]"
        >
          <span>Continue</span>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );

  return (
    <>
      {/* Floating button - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a73e8] text-white shadow-xl shadow-blue-200 transition hover:scale-105"
        aria-label={isOpen ? "Close support widget" : "Open support widget"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Widget popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-20 w-full max-w-[430px] animate-pop">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-blue-100/40 ring-1 ring-slate-100">
            <div className="flex items-center justify-between bg-[#1a73e8] px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                {view !== "welcome" ? (
                  <button
                    onClick={() => setView("welcome")}
                    className="rounded-full p-2 text-white transition hover:bg-white/10"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                ) : null}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              {headerIcon}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{headerTitle}</p>
              <p className="text-xs text-white/80">We’re online</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-white transition hover:bg-white/10"
            aria-label="Close widget"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-slate-50/60 p-6">
          {view === "welcome" && renderWelcome()}
          {view === "chat" && renderChat()}
          {view === "details" && renderDetails()}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-[#1a73e8]">
              <Wand2 className="h-4 w-4" />
            </div>
            <span>Powered by spurnow.com</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>10 min avg. reply</span>
            </div>
          </div>
        </div>
      </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
