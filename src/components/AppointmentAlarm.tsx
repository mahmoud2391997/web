import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ClockIcon, BellIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AppointmentAlarm = () => {
  const { appointments } = useSelector((state: RootState) => state.appointments);
  const [alarmDialog, setAlarmDialog] = useState(false);
  const [currentAlarm, setCurrentAlarm] = useState<any>(null);
  const [checkedAppointments, setCheckedAppointments] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    // Skip if no appointments to check
    if (!appointments || appointments.length === 0) {
      return () => {};
    }
    
    const checkAppointments = () => {
      const now = new Date();
      const currentTime = now.getTime();
      
      appointments.forEach((appointment: any) => {
        if (appointment.status !== 'scheduled' || checkedAppointments.has(appointment.id)) {
          return;
        }

        // Create proper datetime object for comparison
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        const appointmentTime = appointmentDateTime.getTime();
        const timeDifference = appointmentTime - currentTime;
        
        console.log('Checking appointment:', {
          id: appointment.id,
          customer: appointment.customer_name,
          dateTime: appointmentDateTime,
          timeDifference: timeDifference / (1000 * 60), // in minutes
          shouldAlarm: timeDifference > 0 && timeDifference <= 15 * 60 * 1000
        });
        
        // Check if appointment is in the next 15 minutes
        if (timeDifference > 0 && timeDifference <= 15 * 60 * 1000) {
          setCurrentAlarm(appointment);
          setAlarmDialog(true);
          
          // Play alarm sound (if browser supports it)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHBhIqFbF1fdJeVkVHB');
            audio.play();
          } catch (error) {
            console.log('Could not play alarm sound');
          }

          const minutesToAlarm = Math.ceil(timeDifference / (60 * 1000));
          toast({
            title: "Appointment Reminder",
            description: `${appointment.customer_name} has an appointment in ${minutesToAlarm} minutes`,
            duration: 10000,
          });

          setCheckedAppointments(prev => new Set([...prev, appointment.id]));
        }
      });
    };

    // Check immediately
    checkAppointments();
    
    // Check every minute
    const interval = setInterval(checkAppointments, 60000);

    // Ensure interval is cleared when component unmounts
    return () => {
      console.log('Clearing appointment check interval');
      clearInterval(interval);
    };
  }, [appointments, checkedAppointments, toast]);

  const formatTime = (timeString: string) => {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const dismissAlarm = () => {
    setAlarmDialog(false);
    setCurrentAlarm(null);
  };

  return (
    <Dialog open={alarmDialog} onOpenChange={setAlarmDialog}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white border-2 border-yellow-500">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-400">
            <BellIcon className="w-5 h-5 animate-pulse" />
            Appointment Reminder
          </DialogTitle>
        </DialogHeader>
        
        {currentAlarm && (
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">{currentAlarm.customer_name}</h3>
                <Badge className="bg-yellow-600 text-white">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  Upcoming
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{formatDate(currentAlarm.appointment_date)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{formatTime(currentAlarm.appointment_time)}</span>
                </div>
                
                <div className="text-gray-300">
                  Duration: {currentAlarm.duration_hours} hour(s)
                </div>
                
                {currentAlarm.rooms && (
                  <div className="text-gray-300">
                    Room: {currentAlarm.rooms.name} - {currentAlarm.rooms.console_type}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={dismissAlarm} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                <BellIcon className="w-4 h-4 mr-2" />
                Acknowledge
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentAlarm;
