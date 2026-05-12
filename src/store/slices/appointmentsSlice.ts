import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Appointment, getAppointments, createAppointment, updateAppointment, deleteAppointment } from '@/services/dbService';

interface AppointmentsState {
  appointments: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentsState = {
  appointments: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchAppointments = createAsyncThunk('appointments/fetchAppointments', async () => {
  const appointments = await getAppointments();
  return appointments;
});

export const addAppointment = createAsyncThunk(
  'appointments/addAppointment',
  async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
    const newAppointment = await createAppointment(appointmentData);
    return newAppointment;
  }
);

export const editAppointment = createAsyncThunk(
  'appointments/editAppointment',
  async ({ id, updates }: { id: string; updates: Partial<Appointment> }) => {
    const updatedAppointment = await updateAppointment(id, updates);
    return updatedAppointment;
  }
);

export const removeAppointment = createAsyncThunk('appointments/removeAppointment', async (id: string) => {
  await deleteAppointment(id);
  return id;
});

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch appointments';
      })
      // Add appointment
      .addCase(addAppointment.fulfilled, (state, action) => {
        state.appointments.push(action.payload);
      })
      // Edit appointment
      .addCase(editAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      // Remove appointment
      .addCase(removeAppointment.fulfilled, (state, action) => {
        state.appointments = state.appointments.filter(apt => apt.id !== action.payload);
      });
  },
});

export const { clearError } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
