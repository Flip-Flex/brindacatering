import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      if (!auth || !db) throw new Error("Firebase not initialized");
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document already exists
      const userDocRef = doc(db, 'customers', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new profile for Google users
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Customer',
          email: user.email,
          role: 'customer',
          createdAt: serverTimestamp(),
        });
      }

      navigate({ to: '/customer/dashboard' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Image with Overlay */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-center overflow-hidden bg-ink">
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/premium-chettinad.jpg" 
            alt="Premium Catering" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-ink/90" />
        </div>
        
        <div className="relative z-10 p-12 max-w-xl">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity mb-8 animate-in slide-in-from-bottom-8 duration-700">
            <img src="/assets/brindalogo.png" alt="Brinda Caterings" className="h-24 md:h-32 w-auto drop-shadow-2xl" />
          </Link>
          <h2 className="font-display text-4xl lg:text-5xl text-primary-foreground leading-tight mb-6 animate-in slide-in-from-bottom-8 duration-700 delay-75">
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
              <img src="/assets/brindalogo.png" alt="Brinda Caterings" className="h-14 w-auto mx-auto" />
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

          <Button 
            type="button" 
            variant="outline" 
            className="relative w-full h-12 text-base font-medium rounded-xl border-border/60 hover:bg-muted/50 transition-all flex items-center justify-center gap-3" 
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <div className="absolute -top-3 right-4 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20 shadow-sm backdrop-blur-sm">
              Recommended
            </div>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Continue with Google
          </Button>

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
