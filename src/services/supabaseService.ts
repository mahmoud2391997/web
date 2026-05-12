import { getTransactions as getTransactionsFromDb } from '@/services/dbService';

export const getTransactions = async (startDate?: string, endDate?: string) => {
  return await getTransactionsFromDb(startDate, endDate);
};
