import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface CafePaymentSelectorProps {
  order: any;
  onPayment: (selectedItems: string[]) => void;
  onCancel: () => void;
}

export const CafePaymentSelector = ({ order, onPayment, onCancel }: CafePaymentSelectorProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const unpaidCafeItems = order.order_items?.filter((item: any) => 
    item.item_type === 'cafe_product' && !item.is_paid
  ) || [];

  const selectedTotal = unpaidCafeItems
    .filter((item: any) => selectedItems.includes(item.id))
    .reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === unpaidCafeItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(unpaidCafeItems.map((item: any) => item.id));
    }
  };

  return (
    <div className="space-y-4 bg-slate-800 text-white p-4 rounded-lg">
      <p className="text-sm text-gray-300">Select cafe items to pay for:</p>
      
      {unpaidCafeItems.length === 0 ? (
        <p className="text-center text-gray-400 py-4">No unpaid cafe items found</p>
      ) : (
        <>
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-600">
            <Checkbox
              id="select-all"
              checked={selectedItems.length === unpaidCafeItems.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium text-white">
              Select All ({unpaidCafeItems.length} items)
            </label>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unpaidCafeItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={item.id}
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => handleItemToggle(item.id)}
                  />
                  <div>
                    <span className="font-medium text-white">{item.item_name}</span>
                    <span className="text-sm text-gray-400 ml-2">x{item.quantity}</span>
                    <Badge variant="outline" className="ml-2 border-red-500 text-red-400">Unpaid</Badge>
                  </div>
                </div>
                <span className="font-medium text-green-400">{item.total_price?.toFixed(2)} EGP</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-600">
            <div className="flex justify-between items-center font-bold mb-4">
              <span className="text-white">Selected Total:</span>
              <span className="text-green-400">{selectedTotal.toFixed(2)} EGP</span>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1 border-slate-600 text-white hover:bg-slate-700">
          Cancel
        </Button>
        <Button 
          onClick={() => onPayment(selectedItems)} 
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={selectedItems.length === 0}
        >
          Pay Selected ({selectedItems.length})
        </Button>
      </div>
    </div>
  );
};
