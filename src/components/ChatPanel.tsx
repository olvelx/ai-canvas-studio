import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CHAT_MODELS, ChatModel } from '@/lib/models';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, Bot, User, ChevronDown, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Attachment {
  file: File;
  preview?: string; // data URL for images
  type: 'image' | 'document';
}

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
  attachments?: { url: string; name: string; type: 'image' | 'document' }[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const SUPPORTED_DOC_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'text/html', 'text/css', 'application/javascript'];

function getFileType(file: File): 'image' | 'document' | null {
  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) return 'image';
  if (SUPPORTED_DOC_TYPES.includes(file.type)) return 'document';
  // Check by extension for text files
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (['txt', 'md', 'csv', 'json', 'js', 'ts', 'tsx', 'jsx', 'py', 'html', 'css', 'xml', 'yaml', 'yml', 'toml', 'log', 'sh', 'sql'].includes(ext || '')) return 'document';
  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function getMessageText(content: string | MessageContent[]): string {
  if (typeof content === 'string') return content;
  const textParts = content.filter(p => p.type === 'text');
  return textParts.map(p => p.text).join('\n');
}

export const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ChatModel>(CHAT_MODELS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`文件 ${file.name} 超过 10MB 限制`);
        continue;
      }
      const type = getFileType(file);
      if (!type) {
        alert(`不支持的文件类型: ${file.name}\n支持: 图片(JPG/PNG/WebP/GIF)、文本文件(TXT/MD/CSV/JSON/代码文件)`);
        continue;
      }
      let preview: string | undefined;
      if (type === 'image') {
        preview = await fileToBase64(file);
      }
      newAttachments.push({ file, preview, type });
    }
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 5)); // max 5 attachments
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || isLoading) return;

    // Build multimodal content
    const contentParts: MessageContent[] = [];
    const messageAttachments: Message['attachments'] = [];

    // Process attachments
    for (const att of attachments) {
      if (att.type === 'image') {
        const base64 = att.preview || await fileToBase64(att.file);
        contentParts.push({
          type: 'image_url',
          image_url: { url: base64 },
        });
        messageAttachments.push({ url: base64, name: att.file.name, type: 'image' });
      } else {
        // Text file: read content and include as text
        const fileContent = await readTextFile(att.file);
        const truncated = fileContent.length > 50000 ? fileContent.slice(0, 50000) + '\n...(内容已截断)' : fileContent;
        contentParts.push({
          type: 'text',
          text: `[文件: ${att.file.name}]\n\`\`\`\n${truncated}\n\`\`\``,
        });
        messageAttachments.push({ url: '', name: att.file.name, type: 'document' });
      }
    }

    // Add user text
    if (text) {
      contentParts.push({ type: 'text', text });
    }

    const userMsg: Message = {
      role: 'user',
      content: contentParts.length === 1 && contentParts[0].type === 'text' ? text : contentParts,
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    let assistantSoFar = '';

    try {
      // Build API messages (flatten history)
      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel.gatewayModel,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `请求失败 (${resp.status})`);
      }

      if (!resp.body) throw new Error('No stream body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ 错误: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Model selector header */}
      <div className="border-b border-border bg-card/50 px-6 py-3 flex items-center gap-3">
        <span className="text-xs text-muted-foreground">模型：</span>
        <div className="relative">
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm hover:bg-muted transition-colors"
          >
            <span className="font-medium text-foreground">{selectedModel.name}</span>
            <span className="text-xs text-muted-foreground">{selectedModel.provider}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {showModelPicker && (
            <div className="absolute top-full left-0 mt-1 w-72 rounded-lg border border-border bg-card shadow-lg z-50">
              {CHAT_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedModel(m); setShowModelPicker(false); }}
                  className={`w-full flex flex-col p-3 text-left hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    m.id === selectedModel.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">{m.provider}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5">{m.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <h2 className="text-lg font-medium text-muted-foreground">开始对话</h2>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-md">
              选择模型后发送消息，支持上传图片和文本文件辅助对话
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] space-y-2`}>
              {/* Attachment previews */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {msg.attachments.map((att, j) => (
                    att.type === 'image' && att.url ? (
                      <div key={j} className="rounded-lg overflow-hidden border border-border max-w-[240px]">
                        <img src={att.url} alt={att.name} className="w-full max-h-48 object-cover" />
                      </div>
                    ) : (
                      <div key={j} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/80 border border-border">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate max-w-[160px]">{att.name}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
              {/* Message text */}
              <div className={`rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                    <ReactMarkdown>{typeof msg.content === 'string' ? msg.content : getMessageText(msg.content)}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{getMessageText(msg.content)}</p>
                )}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="border-t border-border bg-card/30 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                {att.type === 'image' && att.preview ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img src={att.preview} alt={att.file.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">{att.file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="flex gap-3 items-end">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="上传文件"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.xml,.yaml,.yml,.toml,.log,.sh,.sql"
            className="hidden"
            onChange={handleFileSelect}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，可粘贴或上传图片/文件..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};