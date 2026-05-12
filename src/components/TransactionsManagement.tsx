import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSignIcon, FilterIcon, CreditCardIcon, BanknoteIcon, SmartphoneIcon, TrashIcon } from 'lucide-react';
import { getTransactions, deleteTransaction } from "@/services/dbService";
import { useToast } from '@/hooks/use-toast';

interface TransactionsManagementProps {
  userRole?: string;
}

const TransactionsManagement = ({ userRole = 'admin' }: TransactionsManagementProps) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast } = useToast();

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions(startDate || undefined, endDate || undefined);
      console.log('Loaded transactions:', data);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (userRole === 'cashier') {
      toast({
        title: "Access Denied",
        description: "Cashiers cannot delete transactions",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await deleteTransaction(id);
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <BanknoteIcon className="w-4 h-4" />;
      case 'card': return <CreditCardIcon className="w-4 h-4" />;
      case 'transfer': return <SmartphoneIcon className="w-4 h-4" />;
      default: return <DollarSignIcon className="w-4 h-4" />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'payment' ? 'bg-green-600' : 'bg-red-600';
  };

  const totalAmount = (transactions || []).reduce((sum, tx) => {
    if (!tx || typeof tx.amount === 'undefined') return sum;
    const amount = Number(tx.amount || 0);
    return sum + (tx.transaction_type === 'payment' ? amount : -amount);
  }, 0);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-white">Transactions Management</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <div>
              <Label htmlFor="startDate" className="text-white text-sm">From</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white w-full sm:w-auto"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-white text-sm">To</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white w-full sm:w-auto"
              />
            </div>
          </div>
          <Button onClick={loadTransactions} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <FilterIcon className="w-4 h-4 mr-2" />
            {isLoading ? 'Loading...' : 'Filter'}
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="w-5 h-5" />
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalAmount.toFixed(2)} EGP</div>
          <p className="text-green-100">From {transactions.length} transactions</p>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(transactions || []).filter(tx => tx && tx.id).map((transaction) => (
              <div key={transaction.id} className="flex flex-col p-4 bg-slate-700 rounded-lg gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    {getPaymentIcon((transaction.payment_method || 'cash').toLowerCase())}
                    <Badge className={`${getTransactionTypeColor(transaction.transaction_type)} text-white border-0`}>
                      {transaction.transaction_type.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="text-white min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {transaction.orders?.customer_name || 'Unknown Customer'}
                    </div>
                    <div className="text-sm text-gray-300">
                      {(transaction.orders?.order_type || 'order')?.replace('_', ' ').toUpperCase()} - {(transaction.payment_method || 'cash').toUpperCase()}
                    </div>
                    {transaction.description && (
                      <div className="text-xs text-gray-400 truncate">{transaction.description}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'No date'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className={`font-bold text-lg ${
                    transaction.transaction_type === 'payment' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transaction.transaction_type === 'payment' ? '+' : '-'}
                    {Number(transaction.amount || 0).toFixed(2)} EGP
                  </div>
                  
                  {userRole === 'admin' && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Order Items Details */}
                {transaction.orders?.order_items && Array.isArray(transaction.orders.order_items) && transaction.orders.order_items.length > 0 && (
                  <div className="bg-slate-800 rounded p-3">
                    <div className="text-xs text-gray-400 mb-2">Order Items</div>
                    <div className="space-y-1">
                      {transaction.orders.order_items.filter((item: any) => item && item.id).map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className={`truncate ${item.is_paid ? 'text-green-400' : 'text-gray-300'}`}>
                            {(item.quantity > 0 ? `${item.quantity}x ` : '') + (item.item_name || 'Unknown Item')}
                            {item.is_paid ? ' ✓' : ''}
                          </span>
                          <span className="text-white">{Number(item.total_price || 0).toFixed(2)} EGP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {transactions.length === 0 && !isLoading && (
              <div className="text-center text-gray-400 py-8">
                No transactions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsManagement;
