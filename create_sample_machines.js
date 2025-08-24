// Create sample machines for testing
const sampleMachines = [
  {
    id: 'overlock_001',
    name: 'Overlock Machine #1',
    type: 'Overlock',
    brand: 'Juki',
    model: 'MO-6814S',
    serialNumber: 'OVL001',
    status: 'active',
    location: 'Line A',
    assignedOperator: 'ram.singh',
    specifications: {
      maxSpeed: '7000',
      needleType: 'DC×27',
      threadCount: '4',
      power: '550W'
    },
    maintenanceSchedule: 'monthly',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-02-15'
  },
  {
    id: 'single_needle_001',
    name: 'Single Needle Machine #1',
    type: 'Single Needle',
    brand: 'Brother',
    model: 'S-1000A-3',
    serialNumber: 'SN001',
    status: 'active',
    location: 'Line B',
    assignedOperator: 'sita.devi',
    specifications: {
      maxSpeed: '5500',
      needleType: 'DP×5',
      threadCount: '1',
      power: '400W'
    },
    maintenanceSchedule: 'weekly',
    lastMaintenance: '2024-01-20',
    nextMaintenance: '2024-01-27'
  },
  {
    id: 'flatlock_001',
    name: 'Flatlock Machine #1',
    type: 'Flat Lock',
    brand: 'Pegasus',
    model: 'M752-13',
    serialNumber: 'FL001',
    status: 'active',
    location: 'Line C',
    assignedOperator: '',
    specifications: {
      maxSpeed: '6500',
      needleType: 'DC×27',
      threadCount: '3',
      power: '500W'
    },
    maintenanceSchedule: 'monthly',
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-02-10'
  }
];

console.log('Sample machines created:');
console.log('To add these machines:');
console.log('1. Go to Machine Management');
console.log('2. Click "+ Add Machine" button');
console.log('3. Fill in the details from above');
console.log('');
console.log('Or use the Firebase console to add them directly to the machine_configs collection');