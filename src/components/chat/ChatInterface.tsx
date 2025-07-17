import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  Copy, 
  Check,
  Bot,
  User,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { MessageSkeleton } from '@/components/ui/loading-skeleton';

interface MessageProps {
  message: any;
  onCopy: (text: string) => void;
  copiedId: string | null;
}

function MessageBubble({ message, onCopy, copiedId }: MessageProps) {
  const isUser = message.type === 'user';
  const isCopied = copiedId === message.id;

  return (
    <div className={cn(
      "flex gap-3 group message-enter",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0",
        isUser ? "bg-primary" : "gradient-secondary"
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[80%] sm:max-w-[70%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "relative px-4 py-3 rounded-2xl shadow-md",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-lg" 
            : "bg-card border rounded-tl-lg"
        )}>
          {/* Image if present */}
          {message.imageUrl && (
            <div className="mb-2">
              <img 
                src={message.imageUrl} 
                alt="Uploaded image" 
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
          
          {/* Text content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Copy button */}
          <button
            onClick={() => onCopy(message.content)}
            className={cn(
              "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
              isUser ? "bg-primary-dark text-white" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {isCopied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full gradient-secondary flex items-center justify-center text-white">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-card border rounded-2xl rounded-tl-lg px-4 py-3 shadow-md">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <span className="text-xs text-muted-foreground block mt-1">Gemini is typing...</span>
      </div>
    </div>
  );
}

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuthStore();
  const { 
    currentChatroom, 
    setCurrentChatroom, 
    sendMessage, 
    isTyping,
    loadMoreMessages 
  } = useChatStore();
  const { toast } = useToast();

  // Simulate initial loading of messages
  useEffect(() => {
    if (currentChatroom) {
      setIsLoadingMessages(true);
      const timer = setTimeout(() => {
        setIsLoadingMessages(false);
      }, 1000); // Simulate loading time
      
      return () => clearTimeout(timer);
    }
  }, [currentChatroom?.id]);

  // Track scroll height before loading more
  const prevScrollHeightRef = useRef<number | null>(null);

  // Robust scroll position fix after loading more messages
  useLayoutEffect(() => {
    if (isLoadingMore || prevScrollHeightRef.current === null) return;
    if (messagesContainerRef.current) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const diff = newScrollHeight - (prevScrollHeightRef.current || 0);
      if (diff > 0) {
        messagesContainerRef.current.scrollTop = diff;
      }
    }
    prevScrollHeightRef.current = null;
  }, [currentChatroom?.messages, isLoadingMore]);

  // Handle infinite scroll for loading more messages
  const handleScroll = useCallback(async () => {
    if (!messagesContainerRef.current || !currentChatroom || isLoadingMore) return;
    const container = messagesContainerRef.current;
    if (container.scrollTop === 0) {
      setIsLoadingMore(true);
      prevScrollHeightRef.current = container.scrollHeight;
      try {
        await loadMoreMessages(currentChatroom.id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load more messages.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [currentChatroom, isLoadingMore, loadMoreMessages, toast]);

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedImage) return;
    if (!currentChatroom) return;

    try {
      await sendMessage(message.trim(), imagePreview || undefined);
      setMessage('');
      removeImage();
      // Removed toast notification for message sent
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message.",
        variant: "destructive",
      });
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Dummy suggestions
  const suggestions = [
    {
      question: "What is the weather like today?",
      answer: "The weather today is sunny with a high of 25°C and a low of 15°C."
    },
    {
      question: "Tell me a fun fact about space.",
      answer: "Did you know? A day on Venus is longer than a year on Venus!"
    },
    {
      question: "How do I improve my productivity?",
      answer: "Try breaking tasks into smaller steps and using the Pomodoro technique."
    },
    {
      question: "What's a healthy breakfast idea?",
      answer: "A healthy breakfast could be oatmeal with fruits and nuts, or Greek yogurt with berries."
    },
    {
      question: "Explain quantum computing in simple terms.",
      answer: "Quantum computing uses quantum bits that can be both 0 and 1 at the same time, allowing for powerful computations."
    }
  ];

  if (!currentChatroom) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <Bot className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select a chatroom</h3>
          <p className="text-muted-foreground">
            Choose a chatroom from the sidebar to start chatting with Gemini AI
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading more messages...
            </div>
          </div>
        )}

        {/* Loading skeletons for initial load */}
        {isLoadingMessages ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <MessageSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Messages */}
            {currentChatroom.messages.map((msg, idx) => (
              <div data-msg-idx={idx} key={msg.id}>
                <MessageBubble
                  message={msg}
                  onCopy={(text) => handleCopy(text, msg.id)}
                  copiedId={copiedId}
                />
              </div>
            ))}
            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Bar */}
      <div className="border-t bg-muted/40 px-4 py-2 flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setMessage(s.question)}
            type="button"
          >
            {s.question}
          </Button>
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-24 rounded-lg border"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-32 resize-none pr-12"
              rows={1}
              autoFocus
              aria-label="Type your message"
            />
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              aria-label="Upload image"
            />
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-1 top-1 h-8 w-8"
              aria-label="Upload image"
              tabIndex={0}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            type="submit" 
            variant="gradient"
            size="icon"
            disabled={!message.trim() && !selectedImage}
            className="shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}