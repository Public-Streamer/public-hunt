import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Save, FileText, Loader2 } from 'lucide-react';

interface EventConfig {
    name?: string;
    description?: string;
    ticket_price?: number;
    location?: string;
    media_urls?: string[];
    is_free?: boolean;
    tags?: string[];
    [key: string]: any;
}

interface EventTemplate {
    id: string;
    name: string;
    description?: string;
    config: EventConfig;
    created_at: string;
}

interface EventTemplateManagerProps {
    currentConfig: EventConfig;
    onTemplateLoad: (config: EventConfig) => void;
}

export const EventTemplateManager: React.FC<EventTemplateManagerProps> = ({
    currentConfig,
    onTemplateLoad
}) => {
    const [templates, setTemplates] = useState<EventTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const { user } = useAppContext();
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            fetchTemplates();
        }
    }, [user]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('event_templates' as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a template name.',
                variant: 'destructive'
            });
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('event_templates' as any)
                .insert({
                    user_id: user?.id,
                    name: templateName.trim(),
                    config: currentConfig
                });

            if (error) throw error;

            toast({
                title: 'Template Saved',
                description: `"${templateName}" has been saved.`,
            });

            setTemplateName('');
            setSaveDialogOpen(false);
            fetchTemplates();
        } catch (err) {
            console.error('Error saving template:', err);
            toast({
                title: 'Error',
                description: 'Failed to save template.',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLoadTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            onTemplateLoad(template.config);
            toast({
                title: 'Template Loaded',
                description: `"${template.name}" settings applied.`,
            });
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Delete this template?')) return;

        try {
            const { error } = await supabase
                .from('event_templates' as any)
                .delete()
                .eq('id', templateId);

            if (error) throw error;
            setTemplates(prev => prev.filter(t => t.id !== templateId));
            toast({ title: 'Template Deleted' });
        } catch (err) {
            console.error('Error deleting template:', err);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Load Template */}
            <Select onValueChange={handleLoadTemplate}>
                <SelectTrigger className="w-[180px]">
                    <FileText className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Load Template" />
                </SelectTrigger>
                <SelectContent>
                    {loading ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                            No templates saved
                        </div>
                    ) : (
                        templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                                {template.name}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>

            {/* Save Template */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save as Template
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Event Template</DialogTitle>
                        <DialogDescription>
                            Save your current event settings as a reusable template.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name">Template Name</Label>
                            <Input
                                id="template-name"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="e.g., Weekly Livestream"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EventTemplateManager;
