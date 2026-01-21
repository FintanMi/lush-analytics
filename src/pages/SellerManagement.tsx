import { useState, useEffect } from 'react';
import { analyticsApi } from '@/services/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Store, Mail, Calendar } from 'lucide-react';
import type { Seller } from '@/types/analytics';

const sellerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type SellerFormData = z.infer<typeof sellerSchema>;

export default function SellerManagement() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SellerFormData>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const data = await analyticsApi.getSellers();
      setSellers(data);
    } catch (error) {
      console.error('Failed to load sellers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sellers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SellerFormData) => {
    setIsSubmitting(true);
    try {
      await analyticsApi.createSeller(data.name, data.email || undefined);
      toast({
        title: 'Success',
        description: 'Seller created successfully',
      });
      form.reset();
      setDialogOpen(false);
      loadSellers();
    } catch (error) {
      console.error('Failed to create seller:', error);
      toast({
        title: 'Error',
        description: 'Failed to create seller',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        <Skeleton className="h-16 w-80 bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight gradient-text">Seller Management</h1>
          <p className="text-muted-foreground text-lg">Manage sellers in the analytics system</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Seller
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Seller</DialogTitle>
              <DialogDescription>Create a new seller account</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter seller name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seller@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Creating...' : 'Create Seller'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sellers.map((seller) => (
          <Card key={seller.id} className="card-modern group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-primary/10 to-chart-4/10 rounded-xl group-hover:from-primary/20 group-hover:to-chart-4/20 transition-colors">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{seller.name}</CardTitle>
                    <Badge variant="outline" className="mt-1.5 text-xs">Active</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {seller.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{seller.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(seller.created_at).toLocaleDateString()}</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1.5">Seller ID</p>
                <p className="text-xs font-mono bg-muted/50 p-2.5 rounded-lg truncate border border-border">
                  {seller.id}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sellers.length === 0 && (
        <Card className="card-modern">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-chart-4/10 rounded-2xl w-fit mx-auto mb-6">
              <Store className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No sellers yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by adding your first seller to begin tracking analytics
            </p>
            <Button onClick={() => setDialogOpen(true)} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Seller
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
