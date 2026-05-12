export interface Room {
  id: string;
  name: string;
  console: 'PS4' | 'PS5';
  mode: 'single' | 'multiplayer';
  status: 'available' | 'occupied' | 'cleaning';
  pricing: {
    single: number;
    multiplayer: number;
  };
  currentSession?: {
    customerName: string;
    startTime: Date;
    endTime: Date;
    hours: number;
    totalCost: number;
    products: Product[];
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const roomsData: Room[] = [
  {
    id: 'room-1',
    name: 'Room 1',
    console: 'PS5',
    mode: 'single',
    status: 'available',
    pricing: { single: 50, multiplayer: 70 }
  },
  {
    id: 'room-2',
    name: 'Room 2',
    console: 'PS5',
    mode: 'multiplayer',
    status: 'occupied',
    pricing: { single: 50, multiplayer: 70 },
    currentSession: {
      customerName: 'Ahmed Mohamed',
      startTime: new Date(Date.now() - 1800000), // 30 mins ago
      endTime: new Date(Date.now() + 1800000), // 30 mins from now
      hours: 1,
      totalCost: 70,
      products: []
    }
  },
  {
    id: 'room-3',
    name: 'Room 3',
    console: 'PS4',
    mode: 'single',
    status: 'available',
    pricing: { single: 30, multiplayer: 45 }
  },
  {
    id: 'room-4',
    name: 'Room 4',
    console: 'PS4',
    mode: 'multiplayer',
    status: 'occupied',
    pricing: { single: 30, multiplayer: 45 },
    currentSession: {
      customerName: 'Sara Hassan',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() + 7200000), // 2 hours from now
      hours: 3,
      totalCost: 135,
      products: []
    }
  },
  {
    id: 'room-5',
    name: 'Room 5',
    console: 'PS5',
    mode: 'single',
    status: 'cleaning',
    pricing: { single: 50, multiplayer: 70 }
  },
  {
    id: 'room-6',
    name: 'Room 6',
    console: 'PS4',
    mode: 'single',
    status: 'available',
    pricing: { single: 30, multiplayer: 45 }
  }
];
