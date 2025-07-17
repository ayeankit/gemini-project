import { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import ChatInterface from '@/components/chat/ChatInterface';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Trash2, 
  Calendar,
  Sun,
  Moon,
  Settings,
  LogOut,
  User,
  Loader2,
  Menu,
  Pencil,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { formatDistanceToNow } from 'date-fns';
import { ChatroomSkeleton } from '@/components/ui/loading-skeleton';

export default function Dashboard() {
  const [newChatroomTitle, setNewChatroomTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatroomToDelete, setChatroomToDelete] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [chatroomToRename, setChatroomToRename] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { 
    chatrooms, 
    createChatroom, 
    deleteChatroom, 
    updateChatroomTitle, // <-- add this
    setCurrentChatroom, 
    searchQuery, 
    setSearchQuery,
    getFilteredChatrooms,
    isLoading,
    currentChatroom
  } = useChatStore();
  const { toast } = useToast();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      // The search is already handled by getFilteredChatrooms
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredChatrooms = getFilteredChatrooms();

  const handleCreateChatroom = async () => {
    if (!newChatroomTitle.trim()) return;

    try {
      await createChatroom(newChatroomTitle.trim());
      setNewChatroomTitle('');
      setIsCreateDialogOpen(false);
      toast({
        title: "Chatroom Created",
        description: `"${newChatroomTitle}" has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create chatroom. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChatroom = async () => {
    if (!chatroomToDelete) return;

    try {
      await deleteChatroom(chatroomToDelete);
      setDeleteDialogOpen(false);
      setChatroomToDelete(null);
      toast({
        title: "Chatroom Deleted",
        description: "The chatroom has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chatroom. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (chatroomId: string) => {
    setChatroomToDelete(chatroomId);
    setDeleteDialogOpen(true);
  };

  const openRenameDialog = (chatroomId: string, currentTitle: string) => {
    setChatroomToRename(chatroomId);
    setRenameValue(currentTitle);
    setIsRenameDialogOpen(true);
  };

  const handleRenameChatroom = async () => {
    if (!chatroomToRename || !renameValue.trim()) return;
    try {
      await updateChatroomTitle(chatroomToRename, renameValue.trim());
      setIsRenameDialogOpen(false);
      setChatroomToRename(null);
      setRenameValue('');
      toast({
        title: 'Chatroom Renamed',
        description: 'The chatroom title has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rename chatroom. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleChatroomClick = (chatroom: any) => {
    setCurrentChatroom(chatroom);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Fixed Top Navbar - spans full width */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card/95 backdrop-blur-md">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              {currentChatroom ? (
                <div>
                  <div className="flex items-center"> {/* remove gap, use spacer */}
                    <h1 className="text-lg font-bold">{currentChatroom.title}</h1>
                    {/* Absolutely positioned button at the end of sidebar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentChatroom(null)}
                      className="h-6 px-3 text-xs flex items-center gap-2 absolute left-80 top-1/2 -translate-y-1/2 z-10 shadow-md bg-card"
                      style={{ minWidth: 'max-content' }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Dashboard
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentChatroom.messages.length} messages • Chat with Gemini AI
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="text-lg font-bold">Gemini Chat</h1>
                  <p className="text-xs text-muted-foreground">
                    Welcome back, {user?.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout Container - below navbar */}
      <div className="pt-16 flex h-screen">
        {/* Left Sidebar */}
        <aside className="w-80 border-r bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold">Chat History</h2>
                <p className="text-xs text-muted-foreground">
                  {filteredChatrooms.length} chatrooms
                </p>
              </div>
            </div>

            {/* Search and Create Section */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search chatrooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient" className="w-full h-9">
                    <Plus className="w-4 h-4" />
                    New Chatroom
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Chatroom</DialogTitle>
                    <DialogDescription>
                      Give your new chatroom a memorable name.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Chatroom Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Project Discussion, Creative Ideas..."
                        value={newChatroomTitle}
                        onChange={(e) => setNewChatroomTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCreateChatroom();
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="gradient"
                      onClick={handleCreateChatroom}
                      disabled={!newChatroomTitle.trim() || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Chatroom'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Scrollable Chatroom List */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <ChatroomSkeleton />
            ) : filteredChatrooms.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium mb-1">
                  {searchQuery ? 'No matches found' : 'No chatrooms yet'}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first chatroom to get started'
                  }
                </p>
                {!searchQuery && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="w-3 h-3" />
                    Create Chatroom
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChatrooms.map((chatroom) => (
                  <div
                    key={chatroom.id}
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-muted cursor-pointer group"
                    onClick={() => handleChatroomClick(chatroom)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {chatroom.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs h-5">
                          {chatroom.messages.length}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chatroom.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {chatroom.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          <span className="font-medium">
                            {chatroom.lastMessage.type === 'user' ? 'You' : 'Gemini'}:
                          </span>{' '}
                          {chatroom.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(chatroom.id, chatroom.title);
                        }}
                        title="Rename Chatroom"
                      >
                        <Pencil className="w-3 h-3 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(chatroom.id);
                        }}
                        title="Delete Chatroom"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 h-full">
          {currentChatroom ? (
            // Show chat interface when a chatroom is selected
            <div className="flex-1 flex flex-col min-h-0 h-full">
              <ChatInterface />
            </div>
          ) : (
            // Show welcome screen when no chatroom is selected
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="w-32 h-32 mx-auto mb-8 gradient-primary rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Welcome to Gemini Chat</h2>
                <p className="text-muted-foreground mb-8">
                  Select a chatroom from the sidebar to start chatting with Gemini AI, or create a new one to begin a conversation.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="gradient" 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="px-6"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Chatroom
                  </Button>
                  <Button variant="outline" className="px-6">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chatroom</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chatroom? This action cannot be undone and all messages will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteChatroom}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Chatroom'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Chatroom Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chatroom</DialogTitle>
            <DialogDescription>Enter a new name for your chatroom.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-title">New Title</Label>
              <Input
                id="rename-title"
                placeholder="Enter new chatroom title..."
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRenameChatroom();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="gradient"
              onClick={handleRenameChatroom}
              disabled={!renameValue.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}