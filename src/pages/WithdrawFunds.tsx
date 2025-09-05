import React, { useState } from 'react';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Calendar,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock sales data
const generateSalesData = () => {
  const sales = [];
  for (let i = 1; i <= 50; i++) {
    sales.push({
      id: i,
      eventName: `Event ${i}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      ticketsSold: Math.floor(Math.random() * 100) + 10,
      ticketPrice: Math.floor(Math.random() * 30) + 10,
      grossRevenue: 0,
      stripeFee: 0,
      netRevenue: 0,
      status: Math.random() > 0.1 ? 'Completed' : 'Pending',
    });
  }

  sales.forEach((sale) => {
    sale.grossRevenue = sale.ticketsSold * sale.ticketPrice;
    sale.stripeFee = sale.grossRevenue * 0.029 + 0.3; // Stripe fee
    sale.netRevenue = sale.grossRevenue - sale.stripeFee;
  });

  return sales.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

const WithdrawFunds: React.FC = () => {
  const [bankInfo, setBankInfo] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
  });

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [salesData] = useState(generateSalesData());

  const totalRevenue = salesData.reduce(
    (sum, sale) => sum + sale.netRevenue,
    0
  );
  const availableBalance = totalRevenue * 0.85; // Assuming 15% held in reserve
  const pendingBalance = totalRevenue * 0.15;

  const handleBankInfoChange = (field: string, value: string) => {
    setBankInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Withdrawal requested:', { amount: withdrawAmount, bankInfo });
  };

  const handleBankSetup = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Bank account setup:', bankInfo);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Withdraw Funds</h1>
            <p className="text-gray-600">
              Manage your earnings and transfer funds to your bank account
            </p>
          </div>

          {/* Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${availableBalance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready for withdrawal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Balance
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  ${pendingBalance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Processing (7-14 days)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time earnings
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="withdraw" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              <TabsTrigger value="banking">Banking Info</TabsTrigger>
              <TabsTrigger value="sales">Sales Data</TabsTrigger>
            </TabsList>

            <TabsContent value="withdraw">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="h-5 w-5 mr-2" />
                    Withdraw Funds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <Label htmlFor="withdrawAmount">Withdrawal Amount</Label>
                      <Input
                        id="withdrawAmount"
                        type="number"
                        step="0.01"
                        max={availableBalance}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter amount to withdraw"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Available: ${availableBalance.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">
                        Withdrawal Information
                      </h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Transfers typically take 1-3 business days</li>
                        <li>• Minimum withdrawal amount: $10.00</li>
                        <li>• No fees for standard transfers</li>
                        <li>• Instant transfers available for 1.5% fee</li>
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={!withdrawAmount || !bankInfo.accountNumber}
                      >
                        Request Withdrawal
                      </Button>
                      <Button type="button" variant="outline">
                        Instant Transfer (+1.5%)
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banking">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Banking Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBankSetup} className="space-y-4">
                    <div>
                      <Label htmlFor="accountHolderName">
                        Account Holder Name
                      </Label>
                      <Input
                        id="accountHolderName"
                        value={bankInfo.accountHolderName}
                        onChange={(e) =>
                          handleBankInfoChange(
                            'accountHolderName',
                            e.target.value
                          )
                        }
                        placeholder="Full name on account"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={bankInfo.bankName}
                        onChange={(e) =>
                          handleBankInfoChange('bankName', e.target.value)
                        }
                        placeholder="Name of your bank"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="routingNumber">Routing Number</Label>
                        <Input
                          id="routingNumber"
                          value={bankInfo.routingNumber}
                          onChange={(e) =>
                            handleBankInfoChange(
                              'routingNumber',
                              e.target.value
                            )
                          }
                          placeholder="9-digit routing number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={bankInfo.accountNumber}
                          onChange={(e) =>
                            handleBankInfoChange(
                              'accountNumber',
                              e.target.value
                            )
                          }
                          placeholder="Account number"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="accountType">Account Type</Label>
                      <select
                        id="accountType"
                        value={bankInfo.accountType}
                        onChange={(e) =>
                          handleBankInfoChange('accountType', e.target.value)
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>

                    <Button type="submit">Save Banking Information</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>Sales History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Fees</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.slice(0, 10).map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.eventName}</TableCell>
                          <TableCell>{sale.date}</TableCell>
                          <TableCell>{sale.ticketsSold}</TableCell>
                          <TableCell>${sale.ticketPrice}</TableCell>
                          <TableCell>${sale.grossRevenue.toFixed(2)}</TableCell>
                          <TableCell>${sale.stripeFee.toFixed(2)}</TableCell>
                          <TableCell>${sale.netRevenue.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                sale.status === 'Completed'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {sale.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default WithdrawFunds;
