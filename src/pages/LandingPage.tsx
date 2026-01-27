import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Check, 
  Star,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';

const features = [
  {
    icon: TrendingUp,
    title: 'Real-Time Analytics',
    description: 'Monitor your business metrics in real-time with live updates and instant insights into sales, clicks, and views.'
  },
  {
    icon: Shield,
    title: 'Anomaly Detection',
    description: 'Advanced mathematical models identify unusual patterns and potential fraud before they impact your business.'
  },
  {
    icon: Zap,
    title: 'Predictive Insights',
    description: 'Leverage business intelligence to forecast trends, predict sales, and make data-driven decisions with confidence.'
  },
  {
    icon: BarChart3,
    title: 'Comprehensive Reports',
    description: 'Generate detailed reports with customizable metrics, visualizations, and export options for stakeholder presentations.'
  },
  {
    icon: Shield,
    title: 'Privacy by Design',
    description: 'GDPR compliant with strict data minimization. No PII in analytics paths—only behavioral signals on aggregated data.'
  },
  {
    icon: Zap,
    title: 'High Performance',
    description: 'Ring buffer architecture with zero per-event allocation. Probabilistic caching ensures sub-millisecond response times.'
  }
];

const pricingTiers = [
  {
    name: 'Free',
    price: '0',
    priceValue: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 1,000 events/month',
      'Basic analytics dashboard',
      '7-day data retention',
      'Email support',
      'Single seller account',
      'Privacy by Design',
      'High Performance'
    ],
    highlighted: false
  },
  {
    name: 'Basic',
    price: '50',
    priceValue: 50,
    period: 'month',
    description: 'For growing businesses',
    features: [
      'Up to 50,000 events/month',
      'Advanced analytics',
      '30-day data retention',
      'Priority email support',
      'Up to 5 seller accounts',
      'Anomaly detection',
      'Basic predictions',
      'Privacy by Design',
      'High Performance'
    ],
    highlighted: false
  },
  {
    name: 'Premium',
    price: '300',
    priceValue: 300,
    period: 'month',
    description: 'For established companies',
    features: [
      'Up to 500,000 events/month',
      'Full analytics suite',
      '90-day data retention',
      '24/7 priority support',
      'Up to 25 seller accounts',
      'Advanced anomaly detection',
      'Predictive analytics',
      'Custom reports',
      'API access',
      'Privacy by Design',
      'High Performance'
    ],
    highlighted: true
  }
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'CEO, TechCommerce',
    content: 'Lush Analytics transformed how we understand our customer behavior. The anomaly detection caught a fraud pattern that saved us over €50,000.',
    rating: 5
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Data Director, ShopFlow',
    content: 'The predictive insights are incredibly accurate. We\'ve increased our conversion rate by 34% since implementing Lush Analytics.',
    rating: 5
  },
  {
    name: 'Emma Thompson',
    role: 'Founder, BoutiqueHub',
    content: 'Easy to integrate, powerful insights, and the support team is fantastic. Best analytics platform we\'ve used.',
    rating: 5
  }
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedTier, setSelectedTier] = useState<typeof pricingTiers[0] | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTierSelection = async (tier: typeof pricingTiers[0]) => {
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // User is logged in, proceed with checkout
      if (tier.priceValue === 0) {
        navigate('/dashboard');
        return;
      }
      await processCheckout(tier);
    } else {
      // User not logged in, open signup dialog
      setSelectedTier(tier);
      openDialog(false);
    }
  };

  const handleLogin = () => {
    openDialog(true);
  };

  const processCheckout = async (tier: typeof pricingTiers[0]) => {
    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create_stripe_checkout', {
        body: {
          items: [
            {
              name: `Lush Analytics - ${tier.name} Plan`,
              price: tier.priceValue,
              quantity: 1,
            }
          ],
          currency: 'eur',
          payment_method_types: ['card'],
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.code === 'FAIL') {
        throw new Error(data?.message || 'Failed to create checkout session');
      }

      if (data?.code === 'SUCCESS' && data?.data?.url) {
        // Use window.top to ensure redirect happens at top level (not in iframe)
        if (window.top) {
          window.top.location.href = data.data.url;
        } else {
          window.location.href = data.data.url;
        }
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      let errorMessage = 'Failed to initiate payment. Please try again.';
      let errorTitle = 'Payment Failed';
      
      if (error?.message?.includes('STRIPE_SECRET_KEY')) {
        errorTitle = 'Configuration Error';
        errorMessage = 'Payment system not configured. Please contact support.';
      } else if (error?.message?.includes('Invalid API Key')) {
        errorTitle = 'Configuration Error';
        errorMessage = 'Payment system requires configuration. Please contact an administrator to set up the Stripe API key.';
      } else if (error?.message?.includes('placeholder')) {
        errorTitle = 'Setup Required';
        errorMessage = 'Payment processing is not yet configured. Please contact support to enable payments.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const openDialog = (loginMode = false) => {
    setIsLoginMode(loginMode);
    setEmail('');
    setPassword('');
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
    setIsLoginMode(false);
    setSelectedTier(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        // Login the user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: 'Welcome Back!',
            description: 'You have successfully logged in.',
          });

          closeDialog();

          // Redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        }
      } else {
        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: 'Account Created!',
            description: 'Welcome to Lush Analytics.',
          });

          closeDialog();

          // Handle tier-based redirect
          if (selectedTier) {
            if (selectedTier.priceValue === 0) {
              // Free tier - redirect to dashboard
              setTimeout(() => {
                navigate('/dashboard');
              }, 500);
            } else {
              // Paid tier - redirect to Stripe checkout
              setTimeout(async () => {
                await processCheckout(selectedTier);
              }, 500);
            }
          } else {
            // Default to dashboard
            setTimeout(() => {
              navigate('/dashboard');
            }, 500);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: isLoginMode ? 'Login Failed' : 'Signup Failed',
        description: error.message || `Failed to ${isLoginMode ? 'log in' : 'create account'}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close dialog on escape key or backdrop click
  useEffect(() => {
    const dialog = dialogRef.current;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      closeDialog();
    };

    const handleBackdropClick = (e: MouseEvent) => {
      const rect = dialog?.getBoundingClientRect();
      if (rect && (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )) {
        closeDialog();
      }
    };

    dialog?.addEventListener('cancel', handleCancel);
    dialog?.addEventListener('click', handleBackdropClick);
    return () => {
      dialog?.removeEventListener('cancel', handleCancel);
      dialog?.removeEventListener('click', handleBackdropClick);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-bg py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
              <span className="gradient-text">Lush Analytics</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your data into actionable insights with real-time analytics, 
              anomaly detection, and predictive intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 shadow-lg shadow-primary/20"
                onClick={() => handleTierSelection(pricingTiers[0])}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={handleLogin}
              >
                Login
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to understand and optimize your e-commerce performance
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="card-modern group hover:scale-105 transition-transform duration-200"
              >
                <CardHeader>
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-chart-4/10 rounded-xl w-fit mb-4 group-hover:from-primary/20 group-hover:to-chart-4/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 lg:py-32 gradient-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your business needs
            </p>
          </div>

          {/* CSS-only Accordion */}
          <div className="max-w-4xl mx-auto space-y-4">
            {pricingTiers.map((tier, index) => (
              <div key={index} className="pricing-accordion-item">
                <input 
                  type="radio" 
                  name="pricing-accordion" 
                  id={`pricing-${index}`}
                  className="pricing-accordion-input"
                  defaultChecked={tier.highlighted}
                />
                <label 
                  htmlFor={`pricing-${index}`}
                  className={`pricing-accordion-label ${
                    tier.highlighted ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
                      {tier.highlighted && (
                        <Badge className="bg-gradient-to-r from-primary to-chart-4 text-white px-3 py-1 w-fit">
                          Most Popular
                        </Badge>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{tier.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                      <div className="text-left sm:text-right">
                        <span className="text-3xl font-bold">€{tier.price}</span>
                        <span className="text-muted-foreground text-sm">/{tier.period}</span>
                      </div>
                      <div className="pricing-accordion-icon shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </label>
                <div className="pricing-accordion-content">
                  <div className="p-6 space-y-6">
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full"
                      variant={tier.highlighted ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleTierSelection(tier)}
                      disabled={processingPayment}
                    >
                      {processingPayment ? 'Processing...' : tier.priceValue === 0 ? 'Get Started' : 'Subscribe Now'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Loved by Businesses Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our customers have to say about Lush Analytics
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-modern">
                <CardHeader>
                  <div className="flex gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center text-white font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dialog for CTA */}
      <dialog 
        ref={dialogRef}
        className="backdrop:bg-black/50 bg-card rounded-xl shadow-2xl p-0 max-w-md w-full border border-border"
      >
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {isLoginMode ? 'Welcome Back' : 'Create Your Account'}
            </h3>
            <p className="text-muted-foreground">
              {isLoginMode 
                ? 'Log in to access your Lush Analytics dashboard.' 
                : 'Sign up to get started with Lush Analytics.'
              }
            </p>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="dialog-email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="dialog-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="dialog-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="dialog-password"
                type="password"
                placeholder={isLoginMode ? "Enter your password" : "Create a password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>

            {!isLoginMode && selectedTier && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Selected Plan: {selectedTier.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedTier.priceValue === 0 
                    ? 'Free forever' 
                    : `€${selectedTier.price}/${selectedTier.period} - You'll be redirected to payment after signup`
                  }
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (isLoginMode ? 'Logging in...' : 'Creating Account...') 
                  : (isLoginMode ? 'Login' : 'Sign Up')
                }
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={closeDialog}
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLoginMode 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Login"
              }
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </dialog>
    </div>
  );
}
