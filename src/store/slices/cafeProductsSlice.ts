import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CafeProduct, getCafeProducts, createCafeProduct, updateCafeProduct, deleteCafeProduct } from "@/services/dbService";

interface CafeProductsState {
  products: CafeProduct[];
  loading: boolean;
  error: string | null;
  filter: {
    category: string | null;
    activeOnly: boolean;
  };
}

const initialState: CafeProductsState = {
  products: [],
  loading: false,
  error: null,
  filter: {
    category: null,
    activeOnly: true,
  },
};

// Async thunks
export const fetchCafeProducts = createAsyncThunk('cafeProducts/fetchCafeProducts', async () => {
  const products = await getCafeProducts();
  return products;
});

export const addCafeProduct = createAsyncThunk(
  'cafeProducts/addCafeProduct',
  async (productData: Omit<CafeProduct, 'id' | 'created_at' | 'updated_at'>) => {
    const newProduct = await createCafeProduct(productData);
    return newProduct;
  }
);

export const editCafeProduct = createAsyncThunk(
  'cafeProducts/editCafeProduct',
  async ({ id, updates }: { id: string; updates: Partial<CafeProduct> }) => {
    const updatedProduct = await updateCafeProduct(id, updates);
    return updatedProduct;
  }
);

export const removeCafeProduct = createAsyncThunk('cafeProducts/removeCafeProduct', async (id: string) => {
  await deleteCafeProduct(id);
  return id;
});

const cafeProductsSlice = createSlice({
  name: 'cafeProducts',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    updateStock: (state, action) => {
      const { id, quantity } = action.payload;
      const product = state.products.find(p => p.id === id);
      if (product) {
        product.stock = Math.max(0, product.stock + quantity);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchCafeProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCafeProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchCafeProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cafe products';
      })
      // Add product
      .addCase(addCafeProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
      })
      // Edit product
      .addCase(editCafeProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(product => product.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      // Remove product
      .addCase(removeCafeProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(product => product.id !== action.payload);
      });
  },
});

export const { setFilter, clearError, updateStock } = cafeProductsSlice.actions;
export default cafeProductsSlice.reducer;
