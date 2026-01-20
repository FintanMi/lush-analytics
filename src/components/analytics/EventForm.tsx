import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { analyticsApi } from '@/services/analytics';
import { useToast } from '@/hooks/use-toast';
import type { Seller } from '@/types/analytics';

const eventSchema = z.object({
  sellerId: z.string().min(1, 'Seller is required'),
  type: z.enum(['SALE', 'CLICK', 'VIEW']),
  value: z.string().min(1, 'Value is required'),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  sellers: Seller[];
  onSuccess?: () => void;
}

export function EventForm({ sellers, onSuccess }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      sellerId: '',
      type: 'SALE',
      value: '',
    },
  });

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      await analyticsApi.ingestEvent({
        sellerId: data.sellerId,
        timestamp: Date.now(),
        type: data.type,
        value: parseFloat(data.value),
      });

      toast({
        title: 'Event Ingested',
        description: 'Event has been successfully recorded.',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to ingest event:', error);
      toast({
        title: 'Error',
        description: 'Failed to ingest event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingest Event</CardTitle>
        <CardDescription>Submit a new event to the analytics system</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sellerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seller</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a seller" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SALE">Sale</SelectItem>
                      <SelectItem value="CLICK">Click</SelectItem>
                      <SelectItem value="VIEW">View</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter value"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Submit Event'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
