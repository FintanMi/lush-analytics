import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Bot, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import type { BehaviorFingerprint } from '@/types/analytics';

interface BehaviorFingerprintCardProps {
  fingerprint: BehaviorFingerprint;
}

export function BehaviorFingerprintCard({ fingerprint }: BehaviorFingerprintCardProps) {
  const getPatternIcon = () => {
    switch (fingerprint.patternType) {
      case 'bot':
        return <Bot className="h-5 w-5 text-destructive" />;
      case 'manipulation':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'irregular':
        return <Activity className="h-5 w-5 text-info" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getPatternClass = () => {
    switch (fingerprint.patternType) {
      case 'bot':
        return 'badge-critical';
      case 'manipulation':
        return 'badge-warning';
      case 'irregular':
        return 'badge-info';
      default:
        return 'badge-success';
    }
  };

  const getPatternDescription = () => {
    switch (fingerprint.patternType) {
      case 'bot':
        return 'Automated bot activity detected with high confidence';
      case 'manipulation':
        return 'Potential manipulation patterns identified';
      case 'irregular':
        return 'Irregular behavior patterns observed';
      default:
        return 'Normal human behavior patterns';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Behavior Fingerprint
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPatternIcon()}
            <span className="font-semibold">{fingerprint.patternType.toUpperCase()}</span>
          </div>
          <Badge className={getPatternClass()}>
            {(fingerprint.confidence * 100).toFixed(0)}% confidence
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">{getPatternDescription()}</p>

        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">HFD Complexity</span>
            <span className="font-medium">{fingerprint.hfdPattern.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Timing Entropy</span>
            <span className="font-medium">{fingerprint.timingEntropy.toFixed(2)}</span>
          </div>

          {fingerprint.fftSignature && fingerprint.fftSignature.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground block mb-2">FFT Signature</span>
              <div className="flex gap-1">
                {fingerprint.fftSignature.map((value, index) => (
                  <div key={index} className="flex-1 bg-muted rounded overflow-hidden h-12 flex items-end">
                    <div 
                      className="w-full bg-primary" 
                      style={{ height: `${value * 100}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
