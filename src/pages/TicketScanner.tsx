import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, QrCode, Ticket, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ValidationResult {
    valid: boolean;
    message: string;
    ticketData?: {
        eventName?: string;
        purchaserEmail?: string;
        purchaseDate?: string;
        ticketId?: string;
    };
}

const TicketScanner: React.FC = () => {
    const [ticketCode, setTicketCode] = useState('');
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const { toast } = useToast();

    const handleValidate = async () => {
        if (!ticketCode.trim()) {
            toast({
                title: 'Enter Code',
                description: 'Please enter a ticket code to validate.',
                variant: 'destructive'
            });
            return;
        }

        setValidating(true);
        setResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('validate-ticket', {
                body: { qrPayload: ticketCode.trim() }
            });

            if (error) throw error;

            setResult({
                valid: data.valid,
                message: data.valid
                    ? `✓ Valid ticket for ${data.eventName || 'Event'}`
                    : data.error || 'Invalid or expired ticket',
                ticketData: data.valid ? {
                    eventName: data.eventName,
                    purchaserEmail: data.email,
                    purchaseDate: data.purchaseDate,
                    ticketId: data.ticketId
                } : undefined
            });

            if (data.valid) {
                toast({
                    title: 'Ticket Validated',
                    description: 'Entry granted!',
                });
            }
        } catch (err) {
            console.error('Validation error:', err);
            setResult({
                valid: false,
                message: 'Failed to validate ticket. Please try again.'
            });
            toast({
                title: 'Validation Error',
                description: 'Could not validate the ticket.',
                variant: 'destructive'
            });
        } finally {
            setValidating(false);
        }
    };

    const handleClear = () => {
        setTicketCode('');
        setResult(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleValidate();
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-md">
            <Card className="shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-pink-100 dark:bg-pink-900/30 w-fit">
                        <QrCode className="h-8 w-8 text-pink-600" />
                    </div>
                    <CardTitle className="text-2xl">Ticket Validation</CardTitle>
                    <CardDescription>
                        Enter the ticket code or scan the QR code to validate entry
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Input Section */}
                    <div className="space-y-2">
                        <Label htmlFor="ticket-code">Ticket Code</Label>
                        <Input
                            id="ticket-code"
                            value={ticketCode}
                            onChange={(e) => setTicketCode(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter ticket code..."
                            disabled={validating}
                            className="text-lg font-mono"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleValidate}
                            disabled={validating || !ticketCode.trim()}
                            className="flex-1 bg-pink-600 hover:bg-pink-700"
                        >
                            {validating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Validating...
                                </>
                            ) : (
                                <>
                                    <Ticket className="h-4 w-4 mr-2" />
                                    Validate Ticket
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleClear}
                            disabled={validating}
                        >
                            Clear
                        </Button>
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div className={`p-4 rounded-lg ${result.valid
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            }`}>
                            <div className="flex items-center gap-3 mb-3">
                                {result.valid ? (
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                ) : (
                                    <XCircle className="h-8 w-8 text-red-600" />
                                )}
                                <div>
                                    <p className={`font-semibold ${result.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                                        }`}>
                                        {result.valid ? 'Valid Ticket' : 'Invalid Ticket'}
                                    </p>
                                    <p className={`text-sm ${result.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {result.message}
                                    </p>
                                </div>
                            </div>

                            {/* Ticket Details (if valid) */}
                            {result.valid && result.ticketData && (
                                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800 space-y-2">
                                    {result.ticketData.eventName && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-green-600" />
                                            <span className="text-green-700 dark:text-green-300">
                                                {result.ticketData.eventName}
                                            </span>
                                        </div>
                                    )}
                                    {result.ticketData.purchaserEmail && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-green-600" />
                                            <span className="text-green-700 dark:text-green-300">
                                                {result.ticketData.purchaserEmail}
                                            </span>
                                        </div>
                                    )}
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 mt-2">
                                        Entry Granted
                                    </Badge>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="text-center text-sm text-muted-foreground">
                        <p>Scan the QR code on the ticket or enter the code manually.</p>
                        <p className="mt-1">Each ticket can only be used once.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TicketScanner;
