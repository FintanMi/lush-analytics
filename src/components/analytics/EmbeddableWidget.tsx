import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface EmbeddableWidgetProps {
  sellerId: string;
  apiKey: string;
  type: 'anomaly' | 'health' | 'prediction';
}

export function EmbeddableWidget({ sellerId, apiKey, type }: EmbeddableWidgetProps) {
  const [copied, setCopied] = useState(false);

  const getEmbedCode = () => {
    const baseUrl = window.location.origin;
    
    switch (type) {
      case 'anomaly':
        return `<iframe 
  src="${baseUrl}/embed/anomaly?sellerId=${sellerId}&apiKey=${apiKey}" 
  width="400" 
  height="300" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
</iframe>`;
      
      case 'health':
        return `<iframe 
  src="${baseUrl}/embed/health?sellerId=${sellerId}&apiKey=${apiKey}" 
  width="400" 
  height="400" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
</iframe>`;
      
      case 'prediction':
        return `<iframe 
  src="${baseUrl}/embed/prediction?sellerId=${sellerId}&apiKey=${apiKey}" 
  width="600" 
  height="400" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
</iframe>`;
    }
  };

  const getReactCode = () => {
    return `import { useEffect, useState } from 'react';

function AnalyticsWidget() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('${window.location.origin}/api/analytics/${type}?sellerId=${sellerId}', {
      headers: { 'x-api-key': '${apiKey}' }
    })
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{/* Render your data */}</div>;
}`;
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Code className="h-4 w-4" />
            Embeddable {type.charAt(0).toUpperCase() + type.slice(1)} Widget
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">HTML Embed Code</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(getEmbedCode())}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
            <code>{getEmbedCode()}</code>
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">React Component</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(getReactCode())}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
            <code>{getReactCode()}</code>
          </pre>
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Preview: Copy the code above and paste it into your website or application.
            The widget will automatically fetch and display real-time analytics data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
