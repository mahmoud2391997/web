import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { Room } from '@/data/roomsData';
import { createAppointment, Appointment } from '@/services/dbService';
import { useToast } from '@/hooks/use-toast';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onAppointmentCreated: (appointment: Appointment) => void;
}

const AppointmentModal = ({ isOpen, onClose, room, onAppointmentCreated }: AppointmentModalProps) => {
  const [customerName, setCustomerName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!room) return null;

  const timeOptions = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', 
    '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const durationOptions = [
    { value: 0.5, label: '30 minutes' },
    { value: 1, label: '1 hour' },
    { value: 1.5, label: '1.5 hours' },
    { value: 2, label: '2 hours' },
    { value: 3, label: '3 hours' },
    { value: 4, label: '4 hours' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !appointmentDate || !appointmentTime) return;

    setIsLoading(true);
    try {
      const appointment = await createAppointment({
        room_id: room.id,
        customer_name: customerName.trim(),
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        duration_hours: duration,
        status: 'scheduled'
      });

      onAppointmentCreated(appointment);
      toast({
        title: "Appointment Created",
        description: `Appointment scheduled for ${customerName} in ${room.name}`,
      });
      
      setCustomerName('');
      setAppointmentDate('');
      setAppointmentTime('');
      setDuration(1);
      onClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Schedule Appointment - {room.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customerName" className="text-white">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="appointmentDate" className="text-white">Date</Label>
            <Input
              id="appointmentDate"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <Label className="text-white">Time</Label>
            <Select value={appointmentTime} onValueChange={setAppointmentTime} required>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time} className="text-white hover:bg-slate-600">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Duration</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(parseFloat(value))}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()} className="text-white hover:bg-slate-600">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
              {isLoading ? 'Creating...' : 'Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
