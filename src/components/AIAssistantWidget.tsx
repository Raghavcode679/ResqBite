import React, { useEffect, useRef, useState } from 'react';
import {
  BotMessageSquare,
  X,
  SendHorizontal,
  Loader2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantWidgetProps {
  activeTab: string;
  currentRole: string;
  selectedCity: string;
}

// Short label shown under the greeting to bootstrap the conversation.
const QUICK_QUESTIONS = [
  'What does this website do?',
  'How do I donate surplus food?',
  'How does the AI quality check work?',
  'How do drivers get notified?',
  'How do I get an 80G tax certificate?',
];

const TAB_LABELS: Record<string, string> = {
  radar: 'India Map & Surplus Radar',
  receivers: 'People in Need (Receiver Areas)',
  demand_ai: 'AI Demand Forecast (Kitchen Sizing)',
  quality_lab: 'Vision & IoT Quality Lab',
  industrial_audit: 'Processing Plant Inefficiency Audit',
  secondary_buyers: 'Secondary Upcycling Off-Takers',
  post_surplus: 'Post Kitchen Surplus (AI Pre-Check)',
  driver_hud: 'Driver Route Navigation HUD',
  partners: 'Redistribution Partners',
  impact: 'Impact & ESG Reports',
  admin: 'Logistics Command',
};

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  activeTab,
  currentRole,
  selectedCity,
}) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [poweredBy, setPoweredBy] = useState('');
  const [unreadHint, setUnreadHint] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tabRef = useRef(activeTab);
  const roleRef = useRef(currentRole);
  const cityRef = useRef(selectedCity);
  tabRef.current = activeTab;
  roleRef.current = currentRole;
  cityRef.current = selectedCity;

  // Auto-scroll to latest message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, open]);

  // Focus input whenever the panel opens
  useEffect(() => {
    if (open) {
      setUnreadHint(false);
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError('');
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-14),
          pageContext: {
            tab: tabRef.current,
            tabLabel: TAB_LABELS[tabRef.current] || tabRef.current,
            role: roleRef.current,
            city: cityRef.current,
          },
        }),
      });

      const json = await res.json();
      if (res.ok && json.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: String(json.reply) },
        ]);
        setPoweredBy(json.poweredBy || '');
      } else {
        setError(json.error || 'The assistant could not respond. Please try again.');
      }
    } catch (e: any) {
      setError(
        e?.message
          ? `Connection issue: ${e.message}`
          : 'Could not reach the assistant service.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setInput('');
    setError('');
    setPoweredBy('');
  };

  const greeting: ChatMessage = {
    role: 'assistant',
    content: `Hi! 👋 I'm Omni Assist — your guide to OmniResQ. Ask me anything about how the platform works: posting surplus, claiming deliveries, quality checks, impact reports, or what any tab does. You're currently viewing the **${
      TAB_LABELS[activeTab] || activeTab
    }** tab.`,
  };

  const rendered: ChatMessage[] = messages.length > 0 ? messages : [greeting];

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        className={`fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-200 ${
          open
            ? 'bg-slate-800 text-slate-200 rotate-0'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:scale-105 shadow-emerald-900/50'
        }`}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <BotMessageSquare className="h-7 w-7" />
            {unreadHint && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 border-2 border-slate-950 bg-amber-400"></span>
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 flex h-[560px] max-h-[calc(100vh-140px)] w-[380px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/60"
          role="dialog"
          aria-label="AI Assistant chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-emerald-950/80 to-slate-900 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-900/40">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  Omni Assist
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {poweredBy ? `AI · ${poweredBy}` : 'AI Platform Guide · Online'}
                </div>
              </div>
            </div>
            <button
              onClick={resetConversation}
              title="Reset conversation"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {rendered.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-emerald-600 text-white'
                      : 'rounded-bl-sm bg-slate-800 text-slate-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-slate-800 px-3.5 py-2.5 text-xs text-slate-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  Thinking…
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-900/60 bg-red-950/50 px-3 py-2 text-[11px] text-red-300">
                {error}
              </div>
            )}

            {/* Quick-start questions (only before first exchange) */}
            {messages.length === 0 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-emerald-800/70 bg-emerald-950/60 px-3 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-900 hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-slate-800 bg-slate-950/80 px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any feature…"
              maxLength={1000}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
