import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Transaction, getTransactions, createTransaction, deleteTransaction } from "@/services/dbService";

interface TransactionsState {
  transactions: any[];
  loading: boolean;
  error: string | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const initialState: TransactionsState = {
  transactions: [],
  loading: false,
  error: null,
  dateRange: {
    startDate: '',
    endDate: '',
  },
};

// Async thunks
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async ({ startDate, endDate }: { startDate?: string | null; endDate?: string | null } = {}) => {
    // Convert null to undefined for the database service
    const actualStartDate = startDate === null ? undefined : startDate;
    const actualEndDate = endDate === null ? undefined : endDate;
    
    const transactions = await getTransactions(actualStartDate, actualEndDate);
    return transactions;
  }
);

export const addTransaction = createAsyncThunk(
  'transactions/addTransaction',
  async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    const newTransaction = await createTransaction(transactionData);
    return newTransaction;
  }
);

export const removeTransaction = createAsyncThunk('transactions/removeTransaction', async (id: string) => {
  await deleteTransaction(id);
  return id;
});

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transactions';
      })
      // Add transaction
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      })
      // Remove transaction
      .addCase(removeTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(tx => tx.id !== action.payload);
      });
  },
});

export const { setDateRange, clearError } = transactionsSlice.actions;
export default transactionsSlice.reducer;
