import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Room, getRooms, createRoom, updateRoom, deleteRoom } from "@/services/dbService";

interface RoomsState {
  rooms: Room[];
  loading: boolean;
  error: string | null;
}

const initialState: RoomsState = {
  rooms: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchRooms = createAsyncThunk('rooms/fetchRooms', async () => {
  const rooms = await getRooms();
  return rooms;
});

export const addRoom = createAsyncThunk(
  'rooms/addRoom',
  async (roomData: Omit<Room, 'created_at' | 'updated_at'>) => {
    const newRoom = await createRoom(roomData);
    return newRoom;
  }
);

export const editRoom = createAsyncThunk(
  'rooms/editRoom',
  async ({ id, updates }: { id: string; updates: Partial<Room> }) => {
    const updatedRoom = await updateRoom(id, updates);
    return updatedRoom;
  }
);

export const removeRoom = createAsyncThunk('rooms/removeRoom', async (id: string) => {
  await deleteRoom(id);
  return id;
});

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Optimistic room updates for immediate UI feedback
    updateRoomInState: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.rooms.findIndex(room => room.id === id);
      if (index !== -1) {
        state.rooms[index] = { ...state.rooms[index], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rooms';
      })
      // Add room
      .addCase(addRoom.pending, (state) => {
        state.loading = true;
      })
      .addCase(addRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms.push(action.payload);
      })
      .addCase(addRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add room';
      })
      // Edit room
      .addCase(editRoom.fulfilled, (state, action) => {
        const index = state.rooms.findIndex(room => room.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
      })
      // Remove room
      .addCase(removeRoom.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter(room => room.id !== action.payload);
      });
  },
});

export const { clearError, updateRoomInState } = roomsSlice.actions;
export default roomsSlice.reducer;
