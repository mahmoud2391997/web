import { configureStore } from "@reduxjs/toolkit"
import roomsReducer from "../src/store/slices/roomsSlice"
import ordersReducer from "../src/store/slices/ordersSlice"
import appointmentsReducer from "../src/store/slices/appointmentsSlice"
import transactionsReducer from "../src/store/slices/transactionsSlice"
import cafeProductsReducer from "../src/store/slices/cafeProductsSlice"

export const store = configureStore({
  reducer: {
    rooms: roomsReducer,
    orders: ordersReducer,
    appointments: appointmentsReducer,
    transactions: transactionsReducer,
    cafeProducts: cafeProductsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
