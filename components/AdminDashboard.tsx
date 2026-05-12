import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GamepadIcon, ShoppingCartIcon, CalendarIcon, DollarSignIcon, DatabaseIcon, CogIcon } from "lucide-react"
import RoomsManagement from "@/components/RoomsManagement"
import CafeManagement from "@/components/CafeManagement"
import RoomSchedule from "@/components/RoomSchedule"
import BackupRestore from "@/components/BackupRestore"
import Reports from "@/components/Reports"
import SystemSettings from "@/components/SystemSettings"
import StatisticsCards from "@/components/StatisticsCards"

const AdminDashboard = () => {
  return (
    <div className="space-y-4">
      <StatisticsCards userRole="admin" />

      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800 border-0 text-xs">
          <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-600 text-white">
            <GamepadIcon className="w-4 h-4 mr-2" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-purple-600 text-white">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="cafe" className="data-[state=active]:bg-orange-600 text-white">
            <ShoppingCartIcon className="w-4 h-4 mr-2" />
            Café Products
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-indigo-600 text-white">
            <DollarSignIcon className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-purple-600 text-white">
            <DatabaseIcon className="w-4 h-4 mr-2" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gray-600 text-white">
            <CogIcon className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <RoomsManagement />
        </TabsContent>

        <TabsContent value="schedule">
          <RoomSchedule />
        </TabsContent>

        <TabsContent value="cafe">
          <CafeManagement />
        </TabsContent>

        <TabsContent value="reports">
          <Reports />
        </TabsContent>

        <TabsContent value="backup">
          <BackupRestore />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboard
