import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import LoginForm from '@/components/auth/LoginForm';
import Dashboard from '@/components/dashboard/Dashboard';
import ChatInterface from '@/components/chat/ChatInterface';
import heroImage from '@/assets/hero-bg.jpg';

export default function MainLayout() {
  const { user } = useAuthStore();
  const { currentChatroom } = useChatStore();

  // Show login if not authenticated
  if (!user?.isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
        <div className="relative z-10">
          <LoginForm />
        </div>
      </div>
    );
  }

  // Show dashboard with sidebar (always show sidebar after login)
  return <Dashboard />;
}