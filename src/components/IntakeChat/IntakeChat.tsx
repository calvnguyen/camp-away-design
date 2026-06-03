'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizonal } from 'lucide-react';
import type { TrailerBrief } from '../../types';
import type { IntakeTurn, IntakeAgentResult } from '../../data/agents/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
}

interface IntakeChatProps {
  mode: 'rental' | 'project';
  onBriefSuggestion: (partial: Partial<TrailerBrief>) => void;
}

const GREETING: Message = {
  role: 'assistant',
  content:
    "Hi! Tell me what you have in mind and I'll help you figure out the right trailer setup. For example: \"I need something for 2 people that my Subaru can tow\" or \"I want solar, a wet bath, and a modern kitchen.\"",
};

export function IntakeChat({ mode, onBriefSuggestion }: IntakeChatProps) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    const history: IntakeTurn[] = nextMessages
      .slice(0, -1) // exclude the message we're sending as the current turn
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/agent/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: trimmed, conversationHistory: history, mode }),
      });
      if (!res.ok) throw new Error('Agent request failed');
      const result: IntakeAgentResult = await res.json() as IntakeAgentResult;

      if (Object.keys(result.partialBrief).length > 0) {
        onBriefSuggestion(result.partialBrief);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.assistantMessage,
        followUpQuestions: result.followUpQuestions.length > 0 ? result.followUpQuestions : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setError("Couldn't reach the assistant. Check your connection and try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const statusId = 'intake-chat-status';

  return (
    <section
      aria-label="Intake assistant"
      className="flex flex-col bg-white rounded-3xl border border-[#e3e0da] shadow-lg overflow-hidden"
      style={{ height: 'min(680px, calc(100vh - 8rem))' }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#e3e0da] flex items-center gap-3 shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#2f6f4f]" aria-hidden="true" />
        <h2 className="text-base font-semibold text-[#1c1a17]">Intake Assistant</h2>
        <span className="ml-auto text-xs text-[#6b6560]">AI-guided · form stays the source of truth</span>
      </div>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#2f6f4f] text-white rounded-br-sm'
                  : 'bg-[#f7f6f3] text-[#1c1a17] rounded-bl-sm'
              }`}
            >
              {msg.content}
              {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                <ul className="mt-2 space-y-1 list-none p-0" aria-label="Follow-up questions">
                  {msg.followUpQuestions.map((q, qi) => (
                    <li key={qi}>
                      <button
                        type="button"
                        onClick={() => void send(q)}
                        className="text-xs text-[#2f6f4f] underline underline-offset-2 hover:text-[#25533d] text-left"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start" aria-hidden="true">
            <div className="bg-[#f7f6f3] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-[#6b6560] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-[#6b6560] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-[#6b6560] rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p id={statusId} role="alert" className="px-5 pb-2 text-xs text-[#b4231d] font-medium shrink-0">
          {error}
        </p>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-[#e3e0da] shrink-0">
        <div className="flex gap-2 items-end">
          <label htmlFor="intake-chat-input" className="sr-only">
            Message the intake assistant
          </label>
          <textarea
            id="intake-chat-input"
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Describe what you're looking for…"
            aria-describedby={error ? statusId : undefined}
            className="flex-1 resize-none px-4 py-3 bg-[#f7f6f3] border-2 border-[#e3e0da] rounded-xl text-sm focus:outline-none focus:border-[#2f6f4f] transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={loading || input.trim() === ''}
            aria-label="Send message"
            className="p-3 bg-[#2f6f4f] text-white rounded-xl hover:bg-[#25533d] transition-colors disabled:opacity-40 shrink-0"
          >
            <SendHorizonal className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-[#6b6560] mt-2">Press Enter to send · Shift+Enter for a new line</p>
      </div>
    </section>
  );
}
