import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3Icon, DollarSignIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { fetchTransactions } from '@/store/slices/transactionsSlice';
import { RootState, AppDispatch } from '@/store/store';

const Reports = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading } = useSelector((state: RootState) => state.transactions);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly'>('daily');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    roomRevenue: 0,
    cafeRevenue: 0,
  });

  const loadReportData = async () => {
    // Calculate date range based on period
    const now = new Date();
    let startDate: string | undefined;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = weekStart.toISOString();
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case 'quarterly':
        const quarterStart = new Date(now);
        quarterStart.setMonth(now.getMonth() - 3);
        startDate = quarterStart.toISOString();
        break;
      case 'half-yearly':
        const halfYearStart = new Date(now);
        halfYearStart.setMonth(now.getMonth() - 6);
        startDate = halfYearStart.toISOString();
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        break;
    }
    
    await dispatch(fetchTransactions({ startDate, endDate: now.toISOString() }));
  };

  useEffect(() => {
    loadReportData();
  }, [period, dispatch]);

  useEffect(() => {
    // Calculate stats from transactions
    const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalOrders = transactions.length;
    const roomRevenue = transactions
      .filter(tx => tx.description?.includes('Room') || tx.description?.includes('room'))
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const cafeRevenue = transactions
      .filter(tx => tx.description?.includes('Cafe') || tx.description?.includes('cafe'))
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    
    setStats({ totalRevenue, totalOrders, roomRevenue, cafeRevenue });
  }, [transactions]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'quarterly': return 'Last 3 Months';
      case 'half-yearly': return 'Last 6 Months';
      case 'yearly': return 'This Year';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
        <div className="flex gap-4">
          <Select value={period} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly') => setPeriod(value)}>
            <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="daily" className="text-white hover:bg-slate-600">Daily</SelectItem>
              <SelectItem value="weekly" className="text-white hover:bg-slate-600">Weekly</SelectItem>
              <SelectItem value="monthly" className="text-white hover:bg-slate-600">Monthly</SelectItem>
              <SelectItem value="quarterly" className="text-white hover:bg-slate-600">3 Months</SelectItem>
              <SelectItem value="half-yearly" className="text-white hover:bg-slate-600">6 Months</SelectItem>
              <SelectItem value="yearly" className="text-white hover:bg-slate-600">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadReportData} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} EGP</div>
            <p className="text-xs text-green-100">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <UsersIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-blue-100">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Revenue</CardTitle>
            <TrendingUpIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roomRevenue.toFixed(2)} EGP</div>
            <p className="text-xs text-purple-100">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-600 to-orange-700 border-0 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Café Revenue</CardTitle>
            <BarChart3Icon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cafeRevenue.toFixed(2)} EGP</div>
            <p className="text-xs text-orange-100">{getPeriodLabel()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions - {getPeriodLabel()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="text-white">
                  <div className="font-medium">{transaction.description || 'Transaction'}</div>
                  <div className="text-sm text-gray-300">
                    {transaction.transaction_type?.toUpperCase()} - {transaction.payment_method || 'cash'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(transaction.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-green-400 font-bold">
                  +{Number(transaction.amount).toFixed(2)} EGP
                </div>
              </div>
            ))}
            {transactions.length === 0 && !loading && (
              <div className="text-center text-gray-400 py-8">
                No transactions found for {getPeriodLabel().toLowerCase()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
