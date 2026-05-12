import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GamepadIcon, ShoppingCartIcon, CalendarIcon, DollarSignIcon } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchRooms } from '@/store/slices/roomsSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { fetchCafeProducts } from '@/store/slices/cafeProductsSlice';
import { fetchTransactions } from '@/store/slices/transactionsSlice';

interface StatisticsCardsProps {
  userRole: 'admin' | 'cashier';
}

const StatisticsCards = ({ userRole }: StatisticsCardsProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const roomsState = useSelector((s: RootState) => s.rooms.rooms);
  const ordersState = useSelector((s: RootState) => s.orders.orders);
  const productsState = useSelector((s: RootState) => s.cafeProducts.products);
  const transactionsState = useSelector((s: RootState) => s.transactions.transactions);
  const transactionsLoading = useSelector((s: RootState) => s.transactions.loading);
  const appointmentsState = useSelector((s: RootState) => s.appointments.appointments);

  const [stats, setStats] = useState({
    totalRooms: 0,
    activeSessions: 0,
    monthlyRevenue: 0,
    cafeProducts: 0,
    appointments: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateStats = () => {
    // Use Redux state directly for real-time updates
    const validRooms = Array.isArray(roomsState) ? roomsState : [];
    const validOrders = Array.isArray(ordersState) ? ordersState : [];
    const validProducts = Array.isArray(productsState) ? productsState : [];
    const validTransactions = Array.isArray(transactionsState) ? transactionsState : [];

    // Calculate active sessions - count both room-based and order-based sessions
    const occupiedRooms = validRooms.filter((room: any) => room && room.status === 'occupied').length;
    const activeOrders = validOrders.filter((order: any) => 
      order && (order.status === 'active' || order.status === 'paused')
    ).length;
    const activeSessions = Math.max(occupiedRooms, activeOrders);

    // Calculate today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayRevenue = validTransactions
      .filter((tx: any) => {
        if (!tx || !tx.created_at || tx.transaction_type !== 'payment') return false;
        try {
          const txDate = new Date(tx.created_at);
          return !isNaN(txDate.getTime()) && txDate >= today && txDate < tomorrow;
        } catch {
          return false;
        }
      })
      .reduce((sum: number, tx: any) => sum + (parseFloat(tx.amount) || 0), 0);

    // Calculate monthly revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyRevenue = validTransactions
      .filter((tx: any) => {
        if (!tx || !tx.created_at || tx.transaction_type !== 'payment') return false;
        try {
          const txDate = new Date(tx.created_at);
          return !isNaN(txDate.getTime()) && txDate >= thirtyDaysAgo;
        } catch {
          return false;
        }
      })
      .reduce((sum: number, tx: any) => sum + (parseFloat(tx.amount) || 0), 0);

    return {
      totalRooms: validRooms.length,
      activeSessions,
      monthlyRevenue,
      cafeProducts: validProducts.length,
      appointments: 0, // Will be calculated separately
      todayRevenue,
    };
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Fetch fresh data from Redux
      await Promise.all([
        dispatch(fetchRooms()),
        dispatch(fetchCafeProducts()),
        dispatch(fetchOrders(undefined)),
        dispatch(fetchTransactions({}))
      ]);
      
      // Calculate appointments - try Redux first, then database
      let scheduledAppointments = 0;
      try {
        // First try to fetch fresh appointments
        const { fetchAppointments } = await import('@/store/slices/appointmentsSlice');
        await dispatch(fetchAppointments());
        
        // Use Redux state if available
        const validAppointments = Array.isArray(appointmentsState) ? appointmentsState : [];
        if (validAppointments.length > 0) {
          scheduledAppointments = validAppointments.filter((appointment: any) => 
            appointment && appointment.status === 'scheduled'
          ).length;
        } else {
          // Fallback to direct database call
          const { getAppointments } = await import('@/services/dbService');
          const appointments = await getAppointments();
          const dbAppointments = Array.isArray(appointments) ? appointments : [];
          scheduledAppointments = dbAppointments.filter((appointment: any) => 
            appointment && appointment.status === 'scheduled'
          ).length;
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        // Final fallback to direct database call
        try {
          const { getAppointments } = await import('@/services/dbService');
          const appointments = await getAppointments();
          const validAppointments = Array.isArray(appointments) ? appointments : [];
          scheduledAppointments = validAppointments.filter((appointment: any) => 
            appointment && appointment.status === 'scheduled'
          ).length;
        } catch (fallbackError) {
          console.error('All appointment fetching methods failed:', fallbackError);
        }
      }
      
      const calculatedStats = calculateStats();
      setStats({
        ...calculatedStats,
        appointments: scheduledAppointments
      });
      
    } catch (error) {
      console.error('Error loading statistics:', error);
      const calculatedStats = calculateStats();
      setStats(calculatedStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [dispatch]);

  // Recalculate stats when Redux state changes
  useEffect(() => {
    if (!loading) {
      const calculatedStats = calculateStats();
      // Also update appointments count from Redux state
      const validAppointments = Array.isArray(appointmentsState) ? appointmentsState : [];
      const scheduledAppointments = validAppointments.filter((appointment: any) => 
        appointment && appointment.status === 'scheduled'
      ).length;
      
      setStats(prev => ({ 
        ...prev, 
        ...calculatedStats,
        appointments: scheduledAppointments
      }));
    }
  }, [roomsState, ordersState, productsState, transactionsState, appointmentsState, loading]);

  if (loading || transactionsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Loading...</CardTitle>
              <div className="h-4 w-4 bg-slate-600 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">-</div>
              <p className="text-xs text-gray-400">Loading...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (userRole === 'admin') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Rooms</CardTitle>
            <GamepadIcon className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRooms}</div>
            <p className="text-xs text-gray-400">4 PS5, 4 PS4</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Monthly Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.monthlyRevenue.toFixed(2)} EGP</div>
            <p className="text-xs text-gray-400">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Sessions</CardTitle>
            <CalendarIcon className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeSessions}</div>
            <p className="text-xs text-gray-400">Currently running</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Cafe Products</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.cafeProducts}</div>
            <p className="text-xs text-gray-400">Available items</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cashier dashboard
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Active Sessions</CardTitle>
          <GamepadIcon className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.activeSessions}</div>
          <p className="text-xs text-gray-400">Currently running</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Today's Revenue</CardTitle>
          <DollarSignIcon className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">
            {!transactionsLoading ? `${stats.todayRevenue.toFixed(2)} EGP` : '...'}
          </div>
          <p className="text-xs text-gray-400">Today's total</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Appointments</CardTitle>
          <CalendarIcon className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.appointments}</div>
          <p className="text-xs text-gray-400">Scheduled bookings</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">Cafe Products</CardTitle>
          <ShoppingCartIcon className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.cafeProducts}</div>
          <p className="text-xs text-gray-400">Available items</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards;
