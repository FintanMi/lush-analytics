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
  ArrowRight,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router';

const features = [
  {
    icon: TrendingUp,
    title: 'Real-Time Analytics',
    description: 'Monitor your e-commerce metrics in real-time with live updates and instant insights into sales, clicks, and views.'
  },
  {
    icon: Shield,
    title: 'Anomaly Detection',
    description: 'Advanced AI-powered anomaly detection identifies unusual patterns and potential fraud before they impact your business.'
  },
  {
    icon: Zap,
    title: 'Predictive Insights',
    description: 'Leverage machine learning to forecast trends, predict sales, and make data-driven decisions with confidence.'
  },
  {
    icon: BarChart3,
    title: 'Comprehensive Reports',
    description: 'Generate detailed reports with customizable metrics, visualizations, and export options for stakeholder presentations.'
  }
];

const pricingTiers = [
  {
    name: 'Free',
    price: '0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 1,000 events/month',
      'Basic analytics dashboard',
      '7-day data retention',
      'Email support',
      'Single seller account'
    ],
    highlighted: false
  },
  {
    name: 'Basic',
    price: '50',
    period: 'month',
    description: 'For growing businesses',
    features: [
      'Up to 50,000 events/month',
      'Advanced analytics',
      '30-day data retention',
      'Priority email support',
      'Up to 5 seller accounts',
      'Anomaly detection',
      'Basic predictions'
    ],
    highlighted: false
  },
  {
    name: 'Premium',
    price: '300',
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
      'API access'
    ],
    highlighted: true
  },
  {
    name: 'Business',
    price: '1200',
    period: 'month',
    description: 'For enterprise scale',
    features: [
      'Unlimited events',
      'Enterprise analytics',
      'Unlimited data retention',
      'Dedicated account manager',
      'Unlimited seller accounts',
      'Real-time anomaly detection',
      'Advanced ML predictions',
      'Custom integrations',
      'White-label options',
      'SLA guarantee'
    ],
    highlighted: false
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();

  const openDialog = () => {
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Success!',
      description: 'Thank you for signing up. We\'ll be in touch soon.',
    });

    setEmail('');
    setIsSubmitting(false);
  };

  // Close dialog on escape key
  useEffect(() => {
    const dialog = dialogRef.current;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      closeDialog();
    };

    dialog?.addEventListener('cancel', handleCancel);
    return () => dialog?.removeEventListener('cancel', handleCancel);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-bg py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-8 animate-fade-in">
            <Badge className="mx-auto w-fit" variant="outline">
              🚀 Now with AI-Powered Predictions
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
              <span className="gradient-text">Lush Analytics</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transform your e-commerce data into actionable insights with real-time analytics, 
              anomaly detection, and predictive intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 shadow-lg shadow-primary/20"
                onClick={openDialog}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6"
                asChild
              >
                <Link to="/dashboard">View Dashboard</Link>
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

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={index}
                className={`card-modern relative ${
                  tier.highlighted 
                    ? 'ring-2 ring-primary shadow-xl scale-105' 
                    : ''
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-chart-4 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">€{tier.price}</span>
                    <span className="text-muted-foreground">/{tier.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6"
                    variant={tier.highlighted ? 'default' : 'outline'}
                    onClick={openDialog}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
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

      {/* Email Signup Section */}
      <section className="py-20 lg:py-32 gradient-bg">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <Card className="card-modern glass">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center space-y-6">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-chart-4/10 rounded-2xl w-fit mx-auto">
                  <Mail className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  Stay Updated
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Subscribe to our newsletter for the latest features, tips, and analytics insights
                </p>
                <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 h-12 text-base"
                  />
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={isSubmitting}
                    className="h-12 px-8"
                  >
                    {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dialog for CTA */}
      <dialog 
        ref={dialogRef}
        className="backdrop:bg-black/50 bg-card rounded-xl shadow-2xl p-0 max-w-md w-full border border-border"
      >
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">Start Your Free Trial</h3>
            <p className="text-muted-foreground">
              Get started with Lush Analytics today. No credit card required.
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
              <label htmlFor="company" className="text-sm font-medium">
                Company Name
              </label>
              <Input
                id="company"
                type="text"
                placeholder="Your Company"
                className="h-11"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Starting...' : 'Start Free Trial'}
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

          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </dialog>
    </div>
  );
}
