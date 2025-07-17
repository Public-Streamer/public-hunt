import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users, Globe, Mail, Phone, Building, Clock } from 'lucide-react';

interface CompanyProfileAboutProps {
  profile: {
    company_name: string;
    description: string;
    industry?: string;
    founded_year?: number;
    headquarters?: string;
    website?: string;
    employee_count?: string;
    contact_email?: string;
    contact_phone?: string;
    created_at: string;
  };
}

const CompanyProfileAbout: React.FC<CompanyProfileAboutProps> = ({ profile }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>About {profile.company_name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.description && (
            <div>
              <h4 className="font-semibold mb-2">Company Description</h4>
              <p className="text-muted-foreground leading-relaxed">{profile.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.industry && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {profile.industry}
                </Badge>
                <span className="text-sm text-muted-foreground">Industry</span>
              </div>
            )}
            
            {profile.employee_count && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{profile.employee_count} employees</span>
              </div>
            )}
            
            {profile.founded_year && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Founded in {profile.founded_year}</span>
              </div>
            )}
            
            {profile.headquarters && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{profile.headquarters}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.website && (
            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a 
                href={profile.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {profile.website}
              </a>
            </div>
          )}
          
          {profile.contact_email && (
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a 
                href={`mailto:${profile.contact_email}`}
                className="text-primary hover:underline"
              >
                {profile.contact_email}
              </a>
            </div>
          )}
          
          {profile.contact_phone && (
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a 
                href={`tel:${profile.contact_phone}`}
                className="text-primary hover:underline"
              >
                {profile.contact_phone}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              Joined on {formatDate(profile.created_at)}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Company Profile</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyProfileAbout;