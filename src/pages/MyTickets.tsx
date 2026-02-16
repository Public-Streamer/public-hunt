import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Download, Ticket } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface TicketData {
    id: string;
    qr_code: string;
    status: string;
    created_at: string;
    stripe_payment_intent_id: string;
    event: {
        id: string;
        title: string;
        date: string;
        location: string;
        description: string;
    };
}

const MyTickets: React.FC = () => {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTickets = async () => {
            // Cast to any to bypass type check on new table
            const { data, error } = await supabase
                .from('tickets' as any)
                .select(`
                    id,
                    qr_code,
                    status,
                    created_at,
                    stripe_payment_intent_id,
                    event:events!event_id (
                        id,
                        title,
                        date,
                        location,
                        description
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching tickets:", error);
                toast({
                    title: "Error",
                    description: "Failed to load your tickets.",
                    variant: "destructive",
                });
            } else {
                setTickets(data || []);
            }
            setLoading(false);
        };

        fetchTickets();
    }, []);

    const handleDownloadPDF = (ticket: TicketData) => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(255, 105, 180); // Hot Pink header
        doc.rect(0, 0, 210, 40, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("PublicStreamer Ticket", 105, 25, { align: "center" });

        doc.setTextColor(0, 0, 0);

        // Event Title
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(ticket.event.title, 20, 60);

        // Details
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");

        let y = 80;
        doc.text(`Date: ${format(new Date(ticket.event.date), "PPP p")}`, 20, y);
        y += 10;
        doc.text(`Location: ${ticket.event.location || 'Online Event'}`, 20, y);
        y += 20;

        // QR Code
        if (ticket.qr_code) {
            try {
                doc.addImage(ticket.qr_code, "PNG", 55, y, 100, 100);
                y += 110;
            } catch (e) {
                console.error("Error adding QR to PDF", e);
            }
        }

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Present this code at the event check-in.", 105, y, { align: "center" });
        y += 10;
        doc.text(`Ticket ID: ${ticket.id}`, 105, y, { align: "center" });

        doc.save(`ticket-${ticket.event.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <div className="container mx-auto py-12 px-4 text-center">
                <div className="bg-neutral-50 rounded-lg p-12 max-w-2xl mx-auto border border-dashed border-neutral-300">
                    <Ticket className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Tickets Yet</h2>
                    <p className="text-neutral-600 mb-6">You haven't purchased any tickets yet. Explore upcoming events!</p>
                    <Button onClick={() => navigate('/events')}>Browse Events</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">My Tickets</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket) => (
                    <Card key={ticket.id} className="overflow-hidden flex flex-col">
                        <CardHeader className="bg-neutral-50 border-b pb-4">
                            <CardTitle className="truncate" title={ticket.event.title}>{ticket.event.title}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(ticket.event.date), "MMM d, yyyy • h:mm a")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 flex-1 flex flex-col items-center justify-center">
                            {ticket.qr_code ? (
                                <img src={ticket.qr_code} alt="Ticket QR" className="w-48 h-48 border rounded-lg p-2" />
                            ) : (
                                <div className="w-48 h-48 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400">
                                    No QR Code
                                </div>
                            )}
                            <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate max-w-[200px]">{ticket.event.location || 'Online'}</span>
                            </div>
                            <div className="mt-2 text-xs text-neutral-400 uppercase tracking-widest font-semibold">
                                {ticket.status}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-neutral-50 border-t pt-4">
                            <Button className="w-full" onClick={() => handleDownloadPDF(ticket)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default MyTickets;
