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
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Seller Management</h1>
          <p className="text-muted-foreground">Manage sellers in the analytics system</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sellers.map((seller) => (
          <Card key={seller.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{seller.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">Active</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
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
                <p className="text-xs text-muted-foreground">Seller ID</p>
                <p className="text-xs font-mono bg-muted p-2 rounded mt-1 truncate">
                  {seller.id}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sellers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sellers yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first seller
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Seller
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
