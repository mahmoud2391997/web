import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchRooms } from '@/store/slices/roomsSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { fetchAppointments } from '@/store/slices/appointmentsSlice';

const RoomSchedule = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms } = useSelector((state: RootState) => state.rooms);
  const { orders } = useSelector((state: RootState) => state.orders);
  const { appointments } = useSelector((state: RootState) => state.appointments);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchRooms());
    dispatch(fetchOrders());
    dispatch(fetchAppointments());
  }, [dispatch]);

  // Auto-refresh every 30 seconds to show new appointments
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchAppointments());
      dispatch(fetchOrders());
      dispatch(fetchRooms());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Force refresh when component mounts
  useEffect(() => {
    const forceRefresh = async () => {
      await dispatch(fetchAppointments());
      await dispatch(fetchOrders());
      await dispatch(fetchRooms());
    };
    
    forceRefresh();
  }, [dispatch]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getScheduleForRoom = (roomId: string) => {
    const schedule: { [key: string]: any } = {};
    
    // Add appointments for the selected date
    const validAppointments = Array.isArray(appointments) ? appointments : [];
    validAppointments.forEach((appointment: any) => {
      if (appointment && appointment.room_id === roomId && appointment.appointment_date === selectedDate) {
        const startTime = appointment.appointment_time ? appointment.appointment_time.substring(0, 5) : '00:00';
        const endHour = appointment.appointment_time && appointment.duration_hours ? 
          parseInt(appointment.appointment_time.substring(0, 2)) + appointment.duration_hours : 1;
        const endMinutes = appointment.appointment_time ? appointment.appointment_time.substring(3, 5) : '00';
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes}`;
        
        schedule[startTime] = {
          type: 'appointment',
          customer: appointment.customer_name || 'Unknown',
          status: appointment.status || 'scheduled',
          duration: appointment.duration_hours || 1,
          endTime,
          id: appointment.id,
          startTime
        };
      }
    });

    // Add active sessions (only for today)
    const room = rooms.find(r => r.id === roomId);
    const today = new Date().toISOString().split('T')[0];
    
    if (room && room.status === 'occupied' && room.current_session_start && selectedDate === today) {
      const sessionStart = new Date(room.current_session_start);
      const startTime = sessionStart.toTimeString().substring(0, 5);
      const endTime = room.current_session_end ? 
        new Date(room.current_session_end).toTimeString().substring(0, 5) : 
        'Open';
      
      schedule[startTime] = {
        type: 'session',
        customer: room.current_customer_name,
        status: 'active',
        mode: room.current_mode,
        endTime,
        id: `session-${room.id}`
      };
    }

    // Add paused orders (sessions that can be resumed)
    const validOrders = Array.isArray(orders) ? orders : [];
    validOrders.forEach((order: any) => {
      if (order && order.room_id === roomId) {
        if (order.status === 'paused' && order.start_time && order.end_time) {
          const startTime = new Date(order.start_time).toTimeString().substring(0, 5);
          schedule[startTime] = {
            type: 'paused_session',
            customer: order.customer_name,
            status: 'paused',
            mode: order.mode,
            endTime: new Date(order.end_time).toTimeString().substring(0, 5),
            id: order.id,
            startTime
          };
        }
        // Add completed orders for the selected date to show daily activity
        else if ((order.status === 'completed' || order.status === 'paid') && order.start_time) {
          const orderDate = new Date(order.start_time).toISOString().split('T')[0];
          if (orderDate === selectedDate) {
            const startTime = new Date(order.start_time).toTimeString().substring(0, 5);
            const endTime = order.end_time ? 
              new Date(order.end_time).toTimeString().substring(0, 5) : 
              startTime;
            
            schedule[startTime] = {
              type: order.status === 'paid' ? 'completed_paid' : 'completed_session',
              customer: order.customer_name,
              status: order.status,
              mode: order.mode,
              endTime,
              id: order.id,
              startTime
            };
          }
        }
      }
    });

    return schedule;
  };

  const isTimeSlotOccupied = (roomId: string, timeSlot: string) => {
    const schedule = getScheduleForRoom(roomId);
    const slotTime = new Date(`2000-01-01T${timeSlot}:00`);
    
    for (const [startTime, event] of Object.entries(schedule)) {
      const eventStartTime = new Date(`2000-01-01T${startTime}:00`);
      let eventEndTime;
      
      if (event.endTime === 'Open') {
        eventEndTime = new Date(`2000-01-01T23:59:59`);
      } else {
        eventEndTime = new Date(`2000-01-01T${event.endTime}:00`);
      }
      
      if (slotTime >= eventStartTime && slotTime < eventEndTime) {
        return event;
      }
    }
    
    return null;
  };

  const getEventColor = (event: any) => {
    switch (event.type) {
      case 'appointment':
        return event.status === 'scheduled' ? 'bg-purple-600 text-white' : 'bg-purple-400 text-white';
      case 'session':
        return 'bg-blue-600 text-white';
      case 'paused_session':
        return 'bg-orange-600 text-white';
      case 'completed_session':
        return 'bg-gray-600 text-white';
      case 'completed_paid':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getEventLabel = (event: any) => {
    switch (event.type) {
      case 'appointment':
        return 'APT';
      case 'session':
        return 'LIVE';
      case 'paused_session':
        return 'PAUSE';
      case 'completed_session':
        return 'DONE';
      case 'completed_paid':
        return 'PAID';
      default:
        return 'OCC';
    }
  };

  const filteredRooms = selectedRoom === 'all' ? rooms : rooms.filter(room => room.id === selectedRoom);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Room Schedule</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white rounded px-3 py-1"
              />
            </div>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all" className="text-white">All Rooms</SelectItem>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id} className="text-white">
                    {room.name} - {room.console_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* State Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={stateFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStateFilter('all')}
            className="text-xs"
          >
            All
          </Button>
          <Button
            size="sm"
            variant={stateFilter === 'appointments' ? 'default' : 'outline'}
            onClick={() => setStateFilter('appointments')}
            className="text-xs bg-purple-600 hover:bg-purple-700 border-purple-500"
          >
            Appointments: {Array.isArray(appointments) ? appointments.filter(apt => apt && apt.appointment_date === selectedDate && (selectedRoom === 'all' || apt.room_id === selectedRoom)).length : 0}
          </Button>
          <Button
            size="sm"
            variant={stateFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStateFilter('active')}
            className="text-xs bg-blue-600 hover:bg-blue-700 border-blue-500"
          >
            Active: {filteredRooms.filter(room => room.status === 'occupied').length}
          </Button>
          <Button
            size="sm"
            variant={stateFilter === 'occupied' ? 'default' : 'outline'}
            onClick={() => setStateFilter('occupied')}
            className="text-xs bg-orange-600 hover:bg-orange-700 border-orange-500"
          >
            Occupied: {Array.isArray(orders) ? orders.filter(order => {
              if (!order || (order.status !== 'active' && order.status !== 'completed' && order.status !== 'paid')) return false;
              if (selectedRoom !== 'all' && order.room_id !== selectedRoom) return false;
              if (!order.start_time) return false;
              const orderDate = new Date(order.start_time).toISOString().split('T')[0];
              return orderDate === selectedDate;
            }).length : 0}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredRooms.map(room => (
          <Card key={room.id} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  {room.name} - {room.console_type}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className={
                    room.status === 'available' ? 'bg-green-600' :
                    room.status === 'occupied' ? 'bg-red-600' :
                    room.status === 'cleaning' ? 'bg-yellow-600' :
                    'bg-orange-600'
                  }>
                    {room.status}
                  </Badge>
                  {room.current_customer_name && (
                    <Badge variant="outline" className="text-white border-white">
                      {room.current_customer_name}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-1 text-xs">
                {timeSlots.map(timeSlot => {
                  const event = isTimeSlotOccupied(room.id, timeSlot);
                  
                  // Filter based on selected state
                  const shouldShow = stateFilter === 'all' || 
                    (stateFilter === 'appointments' && event?.type === 'appointment') ||
                    (stateFilter === 'active' && event?.type === 'session') ||
                    (stateFilter === 'occupied' && (event?.type === 'session' || event?.type === 'paused_session' || event?.type === 'completed_session' || event?.type === 'completed_paid'));
                  
                  if (!shouldShow && stateFilter !== 'all') {
                    return null;
                  }
                  
                  return (
                    <div
                      key={timeSlot}
                      className={`
                        p-2 rounded text-center relative min-h-[3rem] flex flex-col justify-center
                        ${event ? 
                          `${getEventColor(event)}` : 
                          'bg-slate-700 text-gray-300 hover:bg-slate-600 cursor-pointer'
                        }
                      `}
                      title={event ? 
                        `${event.customer} - ${event.type === 'appointment' ? 'Appointment' : 
                          event.type === 'session' ? 'Active Session' : 
                          event.type === 'paused_session' ? 'Paused Session' :
                          event.type === 'completed_session' ? 'Completed Session' :
                          event.type === 'completed_paid' ? 'Paid Session' : 'Session'} (${timeSlot} - ${event.endTime})` : 
                        `Available - ${timeSlot}`
                      }
                    >
                      <div className="text-xs font-medium">{timeSlot}</div>
                      {event && (
                        <div className="text-xs font-bold">
                          {getEventLabel(event)}
                        </div>
                      )}
                      {event && event.customer && (
                        <div className="text-xs truncate">
                          {event.customer.substring(0, 6)}
                        </div>
                      )}
                    </div>
                  );
                }).filter(Boolean)}
              </div>
              
              {/* Enhanced Legend */}
              <div className="flex flex-wrap gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  <span className="text-gray-300">Appointment</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-gray-300">Live Session</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-600 rounded"></div>
                  <span className="text-gray-300">Occupied Time</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-slate-700 rounded"></div>
                  <span className="text-gray-300">Available</span>
                </div>
              </div>

              {/* Room Statistics */}
              <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                <div className="text-sm text-gray-300 mb-2">Today's Schedule Summary:</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-purple-400">Appointments: </span>
                    <span className="text-white">
                      {Array.isArray(appointments) ? appointments.filter(apt => apt && apt.room_id === room.id && apt.appointment_date === selectedDate).length : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-400">Active: </span>
                    <span className="text-white">
                      {room.status === 'occupied' ? '1' : '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-orange-400">Occupied: </span>
                    <span className="text-white">
                      {Array.isArray(orders) ? orders.filter(order => {
                        if (!order || order.room_id !== room.id) return false;
                        if (order.status !== 'active' && order.status !== 'completed' && order.status !== 'paid') return false;
                        if (!order.start_time) return false;
                        const orderDate = new Date(order.start_time).toISOString().split('T')[0];
                        return orderDate === selectedDate;
                      }).length : 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoomSchedule;
