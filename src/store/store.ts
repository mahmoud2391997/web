import { configureStore } from '@reduxjs/toolkit';
import roomsReducer from './slices/roomsSlice';
import ordersReducer from './slices/ordersSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import transactionsReducer from './slices/transactionsSlice';
import cafeProductsReducer from './slices/cafeProductsSlice';

export const store = configureStore({
  reducer: {
    rooms: roomsReducer,
    orders: ordersReducer,
    appointments: appointmentsReducer,
    transactions: transactionsReducer,
    cafeProducts: cafeProductsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
