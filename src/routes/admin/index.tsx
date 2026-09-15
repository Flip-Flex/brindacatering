import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/admin/')({
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth not initialized");
      await signInWithEmailAndPassword(auth, email, password);
      navigate({ to: '/admin/dashboard' });
    } catch (err: any) {
      setError('Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/20">
      <div className="w-full max-w-[380px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display tracking-tight text-primary">Brinda Caterings</h1>
          <p className="text-sm text-muted-foreground tracking-wide uppercase">Secure Admin Portal</p>
        </div>
        
        {error && (
          <div className="bg-destructive/5 text-destructive/90 p-3 rounded-md text-sm text-center border border-destructive/20 animate-in fade-in zoom-in-95">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Email address"
              className="h-12 px-4 bg-muted/30 border-border/40 focus:border-primary/50 focus:bg-transparent text-base transition-all rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Password"
              className="h-12 px-4 bg-muted/30 border-border/40 focus:border-primary/50 focus:bg-transparent text-base transition-all rounded-lg"
            />
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full h-12 text-base font-medium rounded-lg transition-transform active:scale-[0.98]" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
