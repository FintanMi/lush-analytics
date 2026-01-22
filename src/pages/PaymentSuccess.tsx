import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setVerifying(false);
      setPaymentStatus('failed');
      toast({
        title: 'Payment Failed',
        description: 'No payment session found.',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    verifyPayment(sessionId);
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify_stripe_payment', {
        body: { sessionId },
      });

      if (error) {
        throw error;
      }

      if (data?.code === 'SUCCESS' && data?.data?.verified) {
        setPaymentStatus('success');
        setPaymentDetails(data.data);
        toast({
          title: 'Payment Successful!',
          description: 'Your payment has been processed successfully.',
          duration: 5000,
        });
      } else {
        setPaymentStatus('failed');
        toast({
          title: 'Payment Failed',
          description: 'Payment verification failed. Please contact support.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'An error occurred during payment verification.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <Card className="card-modern max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            {verifying && 'Verifying Payment...'}
            {!verifying && paymentStatus === 'success' && 'Payment Successful!'}
            {!verifying && paymentStatus === 'failed' && 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {verifying && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-muted-foreground">Please wait while we verify your payment...</p>
            </div>
          )}

          {!verifying && paymentStatus === 'success' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="p-4 bg-success/10 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg">Thank you for your purchase!</p>
                <p className="text-muted-foreground">
                  Your payment has been processed successfully.
                </p>
                {paymentDetails && (
                  <div className="mt-4 p-4 bg-muted rounded-lg text-left space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Amount:</span>{' '}
                      €{((paymentDetails.amount || 0) / 100).toFixed(2)}
                    </p>
                    {paymentDetails.customerEmail && (
                      <p className="text-sm">
                        <span className="font-semibold">Email:</span>{' '}
                        {paymentDetails.customerEmail}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-semibold">Session ID:</span>{' '}
                      {paymentDetails.sessionId}
                    </p>
                  </div>
                )}
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="mt-4"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {!verifying && paymentStatus === 'failed' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="p-4 bg-destructive/10 rounded-full">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg">Payment could not be verified</p>
                <p className="text-muted-foreground">
                  Please contact support if you believe this is an error.
                </p>
              </div>
              <div className="flex gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
