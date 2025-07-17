import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string;
}

export interface Chatroom {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastMessage?: Message;
}

interface ChatState {
  chatrooms: Chatroom[];
  currentChatroom: Chatroom | null;
  isTyping: boolean;
  isLoading: boolean;
  searchQuery: string;
  
  // Actions
  setChatrooms: (chatrooms: Chatroom[]) => void;
  setCurrentChatroom: (chatroom: Chatroom | null) => void;
  setIsTyping: (typing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  
  // Chatroom methods
  createChatroom: (title: string) => Promise<Chatroom>;
  deleteChatroom: (id: string) => Promise<boolean>;
  updateChatroomTitle: (id: string, title: string) => Promise<boolean>;
  
  // Message methods
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  loadMoreMessages: (chatroomId: string) => Promise<Message[]>;
  
  // Search
  getFilteredChatrooms: () => Chatroom[];
}

// Add dummy suggestions for answer matching
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

const generateAIResponse = (userMessage: string): string => {
  // Try to find a matching suggestion
  const match = suggestions.find(s => s.question.toLowerCase() === userMessage.trim().toLowerCase());
  if (match) return match.answer;
  // Otherwise, return a generic response
  const responses = [
    "That's an interesting question! Let me think about that for a moment.",
    "I understand what you're asking. Here's my perspective on that topic.",
    "Great point! I'd be happy to help you explore this further.",
    "Based on what you've shared, I think there are several ways to approach this.",
    "That's a complex topic with many facets. Let me break it down for you.",
    "I appreciate you sharing that with me. Here's what I think about it.",
    "Excellent question! This reminds me of some related concepts.",
    "I see where you're coming from. Let me offer some insights on this.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chatrooms: [],
      currentChatroom: null,
      isTyping: false,
      isLoading: false,
      searchQuery: '',

      setChatrooms: (chatrooms) => set({ chatrooms }),
      setCurrentChatroom: (chatroom) => set({ currentChatroom: chatroom }),
      setIsTyping: (typing) => set({ isTyping: typing }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      createChatroom: async (title: string) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newChatroom: Chatroom = {
          id: Date.now().toString(),
          title,
          messages: [],
          createdAt: new Date(),
        };
        
        const { chatrooms } = get();
        const updatedChatrooms = [newChatroom, ...chatrooms];
        
        set({ 
          chatrooms: updatedChatrooms,
          currentChatroom: newChatroom,
          isLoading: false 
        });
        
        return newChatroom;
      },

      deleteChatroom: async (id: string) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const { chatrooms, currentChatroom } = get();
        const updatedChatrooms = chatrooms.filter(room => room.id !== id);
        
        set({ 
          chatrooms: updatedChatrooms,
          currentChatroom: currentChatroom?.id === id ? null : currentChatroom,
          isLoading: false 
        });
        
        return true;
      },

      updateChatroomTitle: async (id: string, title: string) => {
        const { chatrooms } = get();
        const updatedChatrooms = chatrooms.map(room =>
          room.id === id ? { ...room, title } : room
        );
        
        set({ chatrooms: updatedChatrooms });
        return true;
      },

      sendMessage: async (content: string, imageUrl?: string) => {
        const { currentChatroom, chatrooms } = get();
        if (!currentChatroom) return;

        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          content,
          type: 'user',
          timestamp: new Date(),
          imageUrl,
        };

        const updatedChatroom = {
          ...currentChatroom,
          messages: [...currentChatroom.messages, userMessage],
          lastMessage: userMessage,
        };

        const updatedChatrooms = chatrooms.map(room =>
          room.id === currentChatroom.id ? updatedChatroom : room
        );

        set({ 
          chatrooms: updatedChatrooms,
          currentChatroom: updatedChatroom,
          isTyping: true 
        });

        // Simulate AI typing delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: generateAIResponse(content),
          type: 'ai',
          timestamp: new Date(),
        };

        const finalChatroom = {
          ...updatedChatroom,
          messages: [...updatedChatroom.messages, aiMessage],
          lastMessage: aiMessage,
        };

        const finalChatrooms = chatrooms.map(room =>
          room.id === currentChatroom.id ? finalChatroom : room
        );

        set({ 
          chatrooms: finalChatrooms,
          currentChatroom: finalChatroom,
          isTyping: false 
        });
      },

      loadMoreMessages: async (chatroomId: string) => {
        // Simulate loading older messages
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const dummyMessages: Message[] = Array.from({ length: 20 }, (_, i) => ({
          id: `old-${Date.now()}-${i}`,
          content: `This is an older message ${i + 1}`,
          type: Math.random() > 0.5 ? 'user' : 'ai',
          timestamp: new Date(Date.now() - (i + 1) * 3600000), // 1 hour ago each
        }));

        // Prepend dummy messages to the current chatroom
        const { chatrooms, currentChatroom } = get();
        if (!currentChatroom) return dummyMessages;
        const updatedChatrooms = chatrooms.map(room =>
          room.id === chatroomId
            ? { ...room, messages: [...dummyMessages, ...room.messages] }
            : room
        );
        const updatedCurrentChatroom = updatedChatrooms.find(room => room.id === chatroomId) || null;
        set({
          chatrooms: updatedChatrooms,
          currentChatroom: updatedCurrentChatroom,
        });
        return dummyMessages;
      },

      getFilteredChatrooms: () => {
        const { chatrooms, searchQuery } = get();
        if (!searchQuery.trim()) return chatrooms;
        
        return chatrooms.filter(room =>
          room.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        chatrooms: state.chatrooms,
        currentChatroom: state.currentChatroom 
      }),
    }
  )
);