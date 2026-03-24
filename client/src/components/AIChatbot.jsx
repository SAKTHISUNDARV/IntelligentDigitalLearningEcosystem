import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Menu,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config/api';
import Button from './ui/Button';

const CONTEXT_STORAGE_KEY = (userId) => `idle_ai_context_${userId}`;
const CONVERSATIONS_STORAGE_KEY = (userId) => `idle_ai_conversations_${userId}`;
const ACTIVE_STORAGE_KEY = (userId) => `idle_ai_active_conversation_${userId}`;
const DRAFT_STORAGE_KEY = (userId) => `idle_ai_draft_${userId}`;
const CONTEXT_TTL_MS = 5 * 60 * 1000;
const INITIAL_RENDER_COUNT = 30;
const RENDER_STEP = 20;
const FRIENDLY_ERROR = 'Something went wrong. Please try again.';

function nowIso() {
  return new Date().toISOString();
}

function normalizeContent(content) {
  if (typeof content === 'string') return content;
  if (content == null) return '';
  if (Array.isArray(content)) return content.map(normalizeContent).join('\n\n');
  if (typeof content === 'object') return normalizeContent(content.content ?? content.text ?? '');
  return String(content);
}

function createMessage(role, content = '', extra = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content: normalizeContent(content),
    timestamp: nowIso(),
    ...extra
  };
}

function createConversation() {
  const id = `conversation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    title: 'New conversation',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    messages: []
  };
}

function getConversationTitle(messages) {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.content?.trim();
  if (!firstUserMessage) return 'New conversation';
  return firstUserMessage.length > 42 ? `${firstUserMessage.slice(0, 42)}...` : firstUserMessage;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function MarkdownMessage({ content, isUser }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        h1: ({ children }) => <h1 className="mb-3 text-base font-semibold last:mb-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-3 text-[15px] font-semibold last:mb-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold last:mb-0">{children}</h3>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className={`mb-3 border-l-2 pl-4 italic last:mb-0 ${isUser ? 'border-white/35 text-white/90' : 'border-slate-300 text-slate-600'}`}>
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={`font-medium underline underline-offset-4 ${isUser ? 'text-white' : 'text-blue-600'}`}
          >
            {children}
          </a>
        ),
        code: ({ inline, children }) => {
          if (inline) {
            return (
              <code className={`rounded-md px-1.5 py-0.5 font-mono text-[12px] ${isUser ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {children}
              </code>
            );
          }

          return (
            <pre className={`mb-3 overflow-x-auto rounded-2xl px-4 py-3 text-[13px] last:mb-0 ${isUser ? 'bg-white/10 text-white' : 'bg-slate-950 text-slate-100'}`}>
              <code>{children}</code>
            </pre>
          );
        }
      }}
    >
      {normalizeContent(content)}
    </ReactMarkdown>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
      <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-200" />
    </div>
  );
}

function ChatBubble({ message, onCopy, onRetry }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[780px] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white ${isUser ? 'bg-slate-900' : 'bg-blue-600'}`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        <div
          className={`rounded-3xl px-4 py-3 shadow-sm ${
            isUser
              ? 'rounded-br-md bg-blue-600 text-white'
              : message.error
                ? 'rounded-bl-md border border-red-200 bg-red-50 text-slate-800'
                : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
          }`}
        >
          {message.pending ? (
            <LoadingSkeleton />
          ) : (
            <MarkdownMessage content={message.content} isUser={isUser} />
          )}

          <div className={`mt-3 flex items-center gap-3 text-xs ${isUser ? 'text-white/75' : 'text-slate-400'}`}>
            <span>{formatTime(message.timestamp)}</span>
            {!isUser && !message.pending && !message.error && normalizeContent(message.content) && (
              <button
                type="button"
                onClick={() => onCopy(message)}
                className="inline-flex items-center gap-1 font-medium text-slate-500 transition-colors hover:text-blue-600"
              >
                <Copy size={13} />
                Copy
              </button>
            )}
            {!isUser && message.error && (
              <button
                type="button"
                onClick={() => onRetry(message.retrySource)}
                className="inline-flex items-center gap-1 font-medium text-red-600 transition-colors hover:text-red-700"
              >
                <RotateCcw size={13} />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ prompts, onPromptClick, isAdmin }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-6 py-10">
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.2)]">
          <Bot size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">AI Assistant</h2>
        <p className="mt-2 text-sm text-slate-500">
          {isAdmin
            ? 'Ask for LMS insights, course recommendations, and platform improvement ideas.'
            : 'Ask questions about your learning, lessons, or assessments.'}
        </p>
        {prompts.length > 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPromptClick(prompt)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChatbot() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [contextError, setContextError] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT);
  const scrollRef = useRef(null);

  const userId = user?.id || user?.email || 'guest';
  const conversationsKey = CONVERSATIONS_STORAGE_KEY(userId);
  const activeKey = ACTIVE_STORAGE_KEY(userId);
  const draftKey = DRAFT_STORAGE_KEY(userId);
  const contextKey = CONTEXT_STORAGE_KEY(userId);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0] || null,
    [activeConversationId, conversations]
  );

  const messages = activeConversation?.messages || [];
  const visibleMessages = useMemo(() => messages.slice(Math.max(0, messages.length - visibleCount)), [messages, visibleCount]);
  const hiddenCount = Math.max(0, messages.length - visibleMessages.length);
  const effectiveRole = contextData?.userRole || (user?.role === 'admin' ? 'super_admin' : user?.role || 'student');
  const isAdmin = effectiveRole !== 'student';

  useEffect(() => {
    if (!user) return;

    try {
      const savedConversations = JSON.parse(localStorage.getItem(conversationsKey) || '[]');
      const savedActiveConversationId = localStorage.getItem(activeKey);
      const savedDraft = sessionStorage.getItem(draftKey) || '';

      if (Array.isArray(savedConversations) && savedConversations.length > 0) {
        setConversations(savedConversations);
        setActiveConversationId(
          savedConversations.some((conversation) => conversation.id === savedActiveConversationId)
            ? savedActiveConversationId
            : savedConversations[0].id
        );
      } else {
        const starterConversation = createConversation();
        setConversations([starterConversation]);
        setActiveConversationId(starterConversation.id);
      }

      setInput(savedDraft);
    } catch (error) {
      const starterConversation = createConversation();
      setConversations([starterConversation]);
      setActiveConversationId(starterConversation.id);
      setInput('');
    }
  }, [activeKey, conversationsKey, draftKey, user]);

  useEffect(() => {
    if (!user || !conversations.length) return;
    localStorage.setItem(conversationsKey, JSON.stringify(conversations));
  }, [conversations, conversationsKey, user]);

  useEffect(() => {
    if (!user || !activeConversationId) return;
    localStorage.setItem(activeKey, activeConversationId);
  }, [activeConversationId, activeKey, user]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(draftKey, input);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [draftKey, input, user]);

  useEffect(() => {
    setVisibleCount(INITIAL_RENDER_COUNT);
  }, [activeConversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages.length]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadContext() {
      setContextError('');

      try {
        const cached = sessionStorage.getItem(contextKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.expiresAt > Date.now()) {
            if (!cancelled) {
              setContextData(parsed.context);
              setSuggestedPrompts(parsed.suggestedPrompts || []);
            }
            return;
          }
        }

        const token = localStorage.getItem('idle_token');
        const response = await fetch(`${API_BASE_URL}/chat/context`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load assistant context');
        }

        const data = await response.json();
        if (cancelled) return;

        setContextData(data.context);
        setSuggestedPrompts(data.suggestedPrompts || []);
        sessionStorage.setItem(contextKey, JSON.stringify({
          context: data.context,
          suggestedPrompts: data.suggestedPrompts || [],
          expiresAt: Date.now() + CONTEXT_TTL_MS
        }));
      } catch (error) {
        console.error('[AI Assistant Context]', error);
        if (!cancelled) {
          setContextError(FRIENDLY_ERROR);
        }
      }
    }

    loadContext();
    return () => {
      cancelled = true;
    };
  }, [contextKey, user]);

  function updateConversation(conversationId, updater) {
    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        const updatedConversation = typeof updater === 'function' ? updater(conversation) : updater;
        return {
          ...updatedConversation,
          title: getConversationTitle(updatedConversation.messages),
          updatedAt: nowIso()
        };
      })
    );
  }

  function createNewConversation() {
    const conversation = createConversation();
    setConversations((previous) => [conversation, ...previous]);
    setActiveConversationId(conversation.id);
    setMobileSidebarOpen(false);
  }

  async function copyMessage(message) {
    try {
      await navigator.clipboard.writeText(normalizeContent(message.content));
    } catch (error) {
      console.error('[AI Assistant Copy]', error);
    }
  }

  async function sendMessage(messageText) {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || sending || !activeConversation) return;

    const token = localStorage.getItem('idle_token');
    const userMessage = createMessage('user', trimmedMessage);
    const assistantMessage = createMessage('assistant', '', { pending: true, retrySource: trimmedMessage });
    const historyForRequest = activeConversation.messages
      .filter((message) => !message.pending)
      .map(({ role, content }) => ({ role, content }));

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, userMessage, assistantMessage]
    }));

    setInput('');
    setSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: trimmedMessage,
          history: historyForRequest,
          context: contextData
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start AI stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventText of events) {
          const dataLine = eventText
            .split('\n')
            .find((line) => line.startsWith('data: '));

          if (!dataLine) continue;

          const payload = JSON.parse(dataLine.replace(/^data:\s*/, ''));

          if (payload.type === 'context') {
            setContextData(payload.context || null);
            setSuggestedPrompts(payload.suggestedPrompts || []);
            sessionStorage.setItem(contextKey, JSON.stringify({
              context: payload.context,
              suggestedPrompts: payload.suggestedPrompts || [],
              expiresAt: Date.now() + CONTEXT_TTL_MS
            }));
          }

          if (payload.type === 'chunk') {
            finalContent += payload.delta;
            updateConversation(activeConversation.id, (conversation) => ({
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: finalContent, pending: false, error: false }
                  : message
              )
            }));
          }

          if (payload.type === 'error') {
            throw new Error(payload.error || FRIENDLY_ERROR);
          }
        }
      }

      updateConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: finalContent || FRIENDLY_ERROR,
                pending: false,
                error: !finalContent
              }
            : message
        )
      }));
    } catch (error) {
      console.error('[AI Assistant Send]', error);
      updateConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: FRIENDLY_ERROR,
                pending: false,
                error: true
              }
            : message
        )
      }));
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleRetry(retrySource) {
    if (!retrySource) return;
    void sendMessage(retrySource);
  }

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [conversations]
  );

  return (
    <div className="flex min-h-[calc(100vh-96px)] overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`${
          sidebarOpen ? 'lg:w-[300px] lg:border-r' : 'lg:w-0 lg:border-r-0'
        } fixed inset-y-0 left-0 z-50 w-[280px] overflow-hidden border-slate-200 bg-slate-50 transition-all duration-200 lg:static lg:z-auto ${
          mobileSidebarOpen || sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className={`border-b border-slate-200 ${sidebarOpen ? 'px-4 py-4' : 'px-3 py-3.5'}`}>
            <div className={`flex ${sidebarOpen ? 'items-center justify-between gap-3' : 'flex-col items-center gap-2.5'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center bg-blue-600 text-white ${sidebarOpen ? 'h-10 w-10 rounded-2xl' : 'h-8 w-8 rounded-xl'}`}>
                  <Sparkles size={sidebarOpen ? 18 : 15} />
                </div>
                {sidebarOpen && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
                    <p className="text-xs text-slate-500">Conversation history</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen((previous) => !previous)}
                className={`hidden items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 lg:flex ${sidebarOpen ? 'h-9 w-9' : 'h-8 w-8'}`}
              >
                {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>

            <div className={`mt-4 ${sidebarOpen ? 'block' : 'hidden lg:flex lg:justify-center'}`}>
              {sidebarOpen ? (
                <Button
                  onClick={createNewConversation}
                  className="w-full justify-center"
                >
                  <Plus size={16} />
                  <span>New Chat</span>
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={createNewConversation}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-100 transition-colors hover:bg-blue-500"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto ${sidebarOpen ? 'px-3 py-3' : 'px-2.5 py-4'}`}>
            {sortedConversations.map((conversation) => {
              const active = conversation.id === activeConversation?.id;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setActiveConversationId(conversation.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full text-left transition-all ${
                    sidebarOpen ? 'mb-2 rounded-2xl border px-3 py-3' : 'mb-2.5 flex h-10 justify-center rounded-xl px-2 py-0'
                  } ${
                    active
                      ? sidebarOpen
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'bg-blue-50 text-blue-700 shadow-sm'
                      : sidebarOpen
                        ? 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-100'
                        : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  <div className={`flex ${sidebarOpen ? 'items-start gap-3' : 'items-center justify-center'}`}>
                    <div className={`flex items-center justify-center ${sidebarOpen ? 'mt-0.5 h-8 w-8 rounded-xl' : 'h-7 w-7 rounded-lg'} ${
                      active
                        ? 'bg-blue-600 text-white'
                        : sidebarOpen
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-transparent text-current'
                    }`}>
                      <MessageSquare size={sidebarOpen ? 15 : 13} />
                    </div>
                    {sidebarOpen && (
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{conversation.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{new Date(conversation.updatedAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="relative flex min-w-0 flex-1 flex-col">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            title=""
            className="absolute left-4 top-4 z-10 hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600 lg:flex"
          >
            <ChevronRight size={18} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          title=""
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
          <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col">
            {hiddenCount > 0 && (
              <div className="mb-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((previous) => previous + RENDER_STEP)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-600"
                >
                  Show {Math.min(RENDER_STEP, hiddenCount)} earlier messages
                </button>
              </div>
            )}

            {messages.length === 0 ? (
              <EmptyState
                prompts={suggestedPrompts}
                onPromptClick={(prompt) => setInput(prompt)}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="space-y-5">
                {visibleMessages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    onCopy={copyMessage}
                    onRetry={handleRetry}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto w-full max-w-5xl">
            {contextError && (
              <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {contextError}
              </div>
            )}

            {messages.length === 0 && suggestedPrompts.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="rounded-[24px] border border-slate-200 bg-slate-50 p-2">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={1}
                  placeholder={isAdmin ? 'Ask about LMS analytics, courses, students, or improvements...' : 'Ask a learning question...'}
                  className="max-h-40 min-h-[52px] flex-1 resize-none rounded-[20px] border border-transparent bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-200"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </form>

            <p className="mt-2 text-xs text-slate-400">
              Responses are AI-generated. Review important recommendations before acting on them.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
