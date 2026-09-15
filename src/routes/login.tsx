import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/login')({
  component: CustomerLogin,
});

function CustomerLogin() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth || !db) throw new Error("Firebase not initialized");

      if (isRegistering) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create customer profile in Firestore
        await setDoc(doc(db, 'customers', user.uid), {
          uid: user.uid,
          name: name,
          email: email,
          role: 'customer',
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      // Redirect to customer dashboard
      navigate({ to: '/customer/dashboard' });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Image with Overlay */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-ink">
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/premium-chettinad.jpg" 
            alt="Premium Catering" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/90" />
        </div>
        
        <div className="relative z-10 p-12">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <img src="/assets/brindalogo.png" alt="Brinda Caterers" className="h-14 w-auto drop-shadow-md" />
          </Link>
        </div>
        
        <div className="relative z-10 p-12 max-w-xl">
          <h2 className="font-display text-4xl lg:text-5xl text-primary-foreground leading-tight mb-6 animate-in slide-in-from-bottom-8 duration-700">
            {isRegistering ? 'Start planning your perfect event' : 'Welcome back to Brinda'}
          </h2>
          <p className="text-primary-foreground/70 text-lg leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-150">
            {isRegistering 
              ? 'Create an account to request custom menus, save your favorite catering options, and get personalized quotes.' 
              : 'Sign in to access your dashboard, review your quotes, and finalize your customized menus.'}
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-background">
        {/* Subtle decorative background elements for the right side */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-[440px] space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="lg:hidden text-center mb-10">
            <Link to="/" className="inline-block">
              <img src="/assets/brindalogo.png" alt="Brinda Caterers" className="h-14 w-auto mx-auto" />
            </Link>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-display tracking-tight text-foreground">
              {isRegistering ? 'Create an Account' : 'Sign In'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isRegistering
                ? 'Enter your details below to create your account'
                : 'Enter your email and password to sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm border border-destructive/20 animate-in fade-in zoom-in-95 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground/90">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegistering}
                  placeholder="John Doe"
                  className="h-12 px-4 bg-background/50 backdrop-blur-sm border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-base rounded-xl transition-all"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-foreground/90">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="h-12 px-4 bg-background/50 backdrop-blur-sm border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-base rounded-xl transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-foreground/90">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-12 px-4 pr-12 bg-background/50 backdrop-blur-sm border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-base rounded-xl transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground/90">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={isRegistering}
                    placeholder="••••••••"
                    className="h-12 px-4 pr-12 bg-background/50 backdrop-blur-sm border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-base rounded-xl transition-all"
                  />
                </div>
              </div>
            )}
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0" 
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                Or
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors inline-flex items-center gap-1"
            >
              {isRegistering
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
