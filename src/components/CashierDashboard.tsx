import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GamepadIcon, ShoppingCartIcon, CalendarIcon, DollarSignIcon, ClipboardListIcon, CreditCardIcon, PackageIcon } from 'lucide-react';
import RoomsGrid from '@/components/RoomsGrid';
import AppointmentsManagement from '@/components/AppointmentsManagement';
import CafeManagement from '@/components/CafeManagement';
import CurrentOrders from '@/components/CurrentOrders';
import TransactionsManagement from '@/components/TransactionsManagement';
import PaidOrders from '@/components/PaidOrders';
import AppointmentAlarm from '@/components/AppointmentAlarm';
import StatisticsCards from '@/components/StatisticsCards';

const CashierDashboard = () => {
  return (
    <div className="space-y-6">
      <AppointmentAlarm />
      
      <StatisticsCards userRole="cashier" />

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800 border-0">
          <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-600 text-white">
            <GamepadIcon className="w-4 h-4 mr-2" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="current-orders" className="data-[state=active]:bg-green-600 text-white">
            <ClipboardListIcon className="w-4 h-4 mr-2" />
            Current Orders
          </TabsTrigger>
          <TabsTrigger value="paid-orders" className="data-[state=active]:bg-indigo-600 text-white">
            <PackageIcon className="w-4 h-4 mr-2" />
            Paid Orders
          </TabsTrigger>
          <TabsTrigger value="appointments" className="data-[state=active]:bg-purple-600 text-white">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="cafe" className="data-[state=active]:bg-orange-600 text-white">
            <ShoppingCartIcon className="w-4 h-4 mr-2" />
            Café
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-teal-600 text-white">
            <CreditCardIcon className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Gaming Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <RoomsGrid />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current-orders">
          <CurrentOrders />
        </TabsContent>

        <TabsContent value="paid-orders">
          <PaidOrders />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsManagement />
        </TabsContent>

        <TabsContent value="cafe">
          <CafeManagement />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsManagement userRole="cashier" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashierDashboard;
