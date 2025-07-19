import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface CompanyAccount {
  company_id: string;
  company_name: string;
}

interface CompanyAccountSelectorProps {
  user: User;
  onSelection: (type: 'individual' | 'company', companyId?: string) => void;
  onCancel: () => void;
}

const CompanyAccountSelector: React.FC<CompanyAccountSelectorProps> = ({ 
  user, 
  onSelection, 
  onCancel 
}) => {
  const [companyAccounts, setCompanyAccounts] = useState<CompanyAccount[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyAccounts = async () => {
      try {
        // Get all companies where this user is a company master
        const { data: companyRoles, error } = await supabase
          .from('company_roles')
          .select(`
            company_id,
            company_profiles!inner(company_name)
          `)
          .eq('user_id', user.id)
          .eq('role', 'company_master');

        if (error) {
          console.error('Error fetching company accounts:', error);
          setCompanyAccounts([]);
        } else {
          const companies = companyRoles?.map(role => ({
            company_id: role.company_id,
            company_name: (role.company_profiles as any).company_name
          })) || [];
          setCompanyAccounts(companies);
          
          // Auto-select if only one company
          if (companies.length === 1) {
            setSelectedCompany(companies[0].company_id);
          }
        }
      } catch (error) {
        console.error('Error loading company accounts:', error);
        setCompanyAccounts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyAccounts();
  }, [user.id]);

  const handleIndividualLogin = () => {
    onSelection('individual');
  };

  const handleCompanyLogin = () => {
    if (companyAccounts.length === 1) {
      onSelection('company', companyAccounts[0].company_id);
    } else if (selectedCompany) {
      onSelection('company', selectedCompany);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 auth-template">
        <Card className="w-full max-w-md auth-template">
          <CardContent className="flex items-center justify-center p-8 auth-template">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 auth-template">
      <Card className="w-full max-w-md auth-template">
        <CardHeader>
          <CardTitle>Select Account Type</CardTitle>
          <CardDescription>
            How would you like to sign in today?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 auth-template">
          <Button 
            onClick={handleIndividualLogin}
            className="w-full"
            variant="outline"
          >
            Sign in as Individual
          </Button>

          {companyAccounts.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Company Account</div>
              
              {companyAccounts.length > 1 && (
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyAccounts.map((company) => (
                      <SelectItem key={company.company_id} value={company.company_id}>
                        {company.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button 
                onClick={handleCompanyLogin}
                className="w-full"
                disabled={companyAccounts.length > 1 && !selectedCompany}
              >
                Sign in as Company Master
                {companyAccounts.length === 1 && ` - ${companyAccounts[0].company_name}`}
              </Button>
            </div>
          )}

          <Button 
            onClick={onCancel}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyAccountSelector;