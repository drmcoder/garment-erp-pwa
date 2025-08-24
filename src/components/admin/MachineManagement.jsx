import React, { useState, useEffect, useContext } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AuthContext } from '../../context/AuthContext';
import BackButton from '../common/BackButton';
import { 
  universalDelete, 
  DELETE_PERMISSIONS, 
  DeleteConfirmationModal 
} from '../../utils/deleteUtils';
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  onSnapshot, 
  serverTimestamp 
} from '../../config/firebase';
import { COLLECTIONS } from '../../config/firebase';

const MachineManagement = ({ onStatsUpdate, onBack }) => {
  const { currentLanguage } = useLanguage();
  const { user } = useContext(AuthContext);
  const [machines, setMachines] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByType, setFilterByType] = useState('all');

  const [newMachine, setNewMachine] = useState({
    id: '',
    name: '',
    type: 'Single Needle',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    status: 'active',
    location: '',
    assignedOperator: '',
    maintenanceSchedule: 'monthly',
    lastMaintenance: '',
    nextMaintenance: '',
    specifications: {
      maxSpeed: '',
      needleType: '',
      threadCount: '',
      power: ''
    },
    notes: ''
  });

  const machineTypes = [
    'Single Needle',
    'Overlock',
    'Cover Stitch',
    'Button Hole',
    'Bartack',
    'Zigzag',
    'Blind Hem',
    'Flat Lock',
    'Chain Stitch',
    'Embroidery',
    'Cutting Machine',
    'Fusing Machine'
  ];

  useEffect(() => {
    // Set up real-time listener for machines
    const machinesRef = collection(db, COLLECTIONS.MACHINE_CONFIGS);
    const unsubscribe = onSnapshot(machinesRef, (snapshot) => {
      const machinesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMachines(machinesData);
      console.log(`🔄 Real-time update: ${machinesData.length} machines loaded`);
      if (onStatsUpdate) onStatsUpdate();
    }, (error) => {
      console.error('❌ Error in real-time listener:', error);
      // Fallback to manual load
      loadData();
    });

    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      console.log('🔍 Loading machine data from Firebase...');
      const machinesRef = collection(db, COLLECTIONS.MACHINE_CONFIGS);
      const snapshot = await getDocs(machinesRef);
      const machinesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setMachines(machinesData);
      console.log(`✅ Loaded ${machinesData.length} machines from Firebase`);
      
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('❌ Error loading machine data from Firebase:', error);
      // Fallback to localStorage if Firebase fails
      try {
        const savedMachines = JSON.parse(localStorage.getItem('machines') || '[]');
        
        // If no machines exist, add sample machines
        if (savedMachines.length === 0) {
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
              nextMaintenance: '2024-02-15',
              createdAt: new Date().toISOString()
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
              nextMaintenance: '2024-01-27',
              createdAt: new Date().toISOString()
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
              nextMaintenance: '2024-02-10',
              createdAt: new Date().toISOString()
            }
          ];
          
          localStorage.setItem('machines', JSON.stringify(sampleMachines));
          setMachines(sampleMachines);
          console.log('✨ Created sample machines for demo');
        } else {
          setMachines(savedMachines);
          console.log('📦 Loaded machines from localStorage as fallback');
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    }
  };

  const saveMachineToFirebase = async (machineData, isUpdate = false, machineId = null) => {
    try {
      console.log('🔍 Saving machine to Firebase:', { isUpdate, machineId });
      
      const dataToSave = {
        ...machineData,
        updatedAt: serverTimestamp(),
        ...(isUpdate ? {} : { createdAt: serverTimestamp() })
      };

      let result;
      if (isUpdate && machineId) {
        await updateDoc(doc(db, COLLECTIONS.MACHINE_CONFIGS, machineId), dataToSave);
        result = machineId;
        console.log(`✅ Machine updated in Firebase: ${machineId}`);
      } else {
        const docRef = await addDoc(collection(db, COLLECTIONS.MACHINE_CONFIGS), dataToSave);
        result = docRef.id;
        console.log(`✅ Machine added to Firebase: ${result}`);
      }
      
      // Reload data after save
      await loadData();
      return result;
    } catch (error) {
      console.error('❌ Error saving machine to Firebase:', error);
      // Fallback to localStorage
      try {
        const currentMachines = JSON.parse(localStorage.getItem('machines') || '[]');
        let updatedMachines;
        
        if (isUpdate && machineId) {
          updatedMachines = currentMachines.map(m => m.id === machineId ? { ...machineData, id: machineId } : m);
        } else {
          updatedMachines = [...currentMachines, machineData];
        }
        
        localStorage.setItem('machines', JSON.stringify(updatedMachines));
        setMachines(updatedMachines);
        console.log('📦 Saved to localStorage as fallback');
        
        if (onStatsUpdate) onStatsUpdate();
        return machineData.id;
      } catch (localError) {
        console.error('Error saving to localStorage:', localError);
        throw error;
      }
    }
  };

  const generateMachineId = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `M${timestamp}`;
  };

  const calculateNextMaintenance = (lastMaintenance, schedule) => {
    if (!lastMaintenance) return '';
    
    const date = new Date(lastMaintenance);
    switch (schedule) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    
    return date.toISOString().split('T')[0];
  };

  const handleCreateMachine = async () => {
    if (!newMachine.name || !newMachine.type) {
      alert('Machine name and type are required');
      return;
    }

    try {
      const machine = {
        ...newMachine,
        id: generateMachineId(),
        nextMaintenance: calculateNextMaintenance(newMachine.lastMaintenance, newMachine.maintenanceSchedule),
        performance: {
          totalHours: 0,
          totalProduction: 0,
          efficiency: 100,
          downtime: 0,
          lastUsed: null
        }
      };

      await saveMachineToFirebase(machine, false);

      // Reset form
      setNewMachine({
        id: '',
        name: '',
        type: 'Single Needle',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        status: 'active',
        location: '',
        assignedOperator: '',
        maintenanceSchedule: 'monthly',
        lastMaintenance: '',
        nextMaintenance: '',
        specifications: {
          maxSpeed: '',
          needleType: '',
          threadCount: '',
          power: ''
        },
        notes: ''
      });

      setIsCreating(false);
      alert('Machine added successfully!');
    } catch (error) {
      alert('Error adding machine. Please try again.');
    }
  };

  const handleUpdateMachine = async () => {
    try {
      const updatedMachine = {
        ...editingMachine,
        nextMaintenance: calculateNextMaintenance(editingMachine.lastMaintenance, editingMachine.maintenanceSchedule)
      };

      await saveMachineToFirebase(updatedMachine, true, editingMachine.id);
      setEditingMachine(null);
      alert('Machine updated successfully!');
    } catch (error) {
      alert('Error updating machine. Please try again.');
    }
  };

  const handleDeleteMachine = async (machineId) => {
    const machineToDelete = machines.find(m => m.id === machineId);
    if (!machineToDelete) return;

    try {
      await universalDelete({
        item: machineToDelete,
        itemName: currentLanguage === 'np' ? 'मेसिन' : 'Machine',
        user,
        permissionLevel: DELETE_PERMISSIONS.UNRESTRICTED,
        permissionOptions: { allowedRoles: ['management', 'admin'] },
        language: currentLanguage === 'np' ? 'np' : 'en',
        collectionName: COLLECTIONS.MACHINE_CONFIGS,
        deleteOptions: {
          checkDependencies: [
            {
              collection: COLLECTIONS.BUNDLES,
              field: 'assignedMachine',
              name: currentLanguage === 'np' ? 'बन्डलहरू' : 'bundles'
            },
            {
              collection: COLLECTIONS.WORK_ASSIGNMENTS,
              field: 'machineId',
              name: currentLanguage === 'np' ? 'काम असाइनमेन्टहरू' : 'work assignments'
            }
          ]
        },
        onSuccess: async () => {
          console.log('✅ Machine deleted successfully from Firebase');
          // Reload data after delete
          await loadData();
          
          // Fallback: also remove from localStorage
          try {
            const currentMachines = JSON.parse(localStorage.getItem('machines') || '[]');
            const updatedMachines = currentMachines.filter(machine => machine.id !== machineId);
            localStorage.setItem('machines', JSON.stringify(updatedMachines));
          } catch (localError) {
            console.error('Error updating localStorage:', localError);
          }
        },
        onError: async (errorMessage) => {
          console.error('❌ Error deleting machine from Firebase:', errorMessage);
          
          // Fallback to localStorage
          try {
            const currentMachines = JSON.parse(localStorage.getItem('machines') || '[]');
            const updatedMachines = currentMachines.filter(machine => machine.id !== machineId);
            localStorage.setItem('machines', JSON.stringify(updatedMachines));
            setMachines(updatedMachines);
            console.log('📦 Deleted from localStorage as fallback');
            
            if (onStatsUpdate) onStatsUpdate();
            alert(currentLanguage === 'np' ? 'मेसिन सफलतापूर्वक मेटाइयो!' : 'Machine deleted successfully!');
          } catch (localError) {
            console.error('Error deleting from localStorage:', localError);
            alert(currentLanguage === 'np' ? 'मेसिन मेटाउन त्रुटि भयो।' : 'Error deleting machine. Please try again.');
          }
        }
      });
      
    } catch (error) {
      console.error('Error in handleDeleteMachine:', error);
      alert(currentLanguage === 'np' ? 'मेसिन मेटाउन त्रुटि भयो।' : 'Error deleting machine. Please try again.');
    }
  };

  const updateSpecification = (field, value) => {
    if (editingMachine) {
      setEditingMachine(prev => ({
        ...prev,
        specifications: { ...(prev.specifications || {}), [field]: value }
      }));
    } else {
      setNewMachine(prev => ({
        ...prev,
        specifications: { ...(prev.specifications || {}), [field]: value }
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'repair': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isMaintenanceDue = (machine) => {
    if (!machine.nextMaintenance) return false;
    const today = new Date();
    const maintenanceDate = new Date(machine.nextMaintenance);
    return maintenanceDate <= today;
  };

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterByType === 'all' || machine.type === filterByType;
    return matchesSearch && matchesType;
  });

  if (isCreating || editingMachine) {
    const currentData = editingMachine || newMachine;
    const setCurrentData = editingMachine ? setEditingMachine : setNewMachine;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingMachine 
              ? (currentLanguage === 'en' ? 'Edit Machine' : 'मेसिन सम्पादन गर्नुहोस्')
              : (currentLanguage === 'en' ? 'Add New Machine' : 'नयाँ मेसिन थप्नुहोस्')
            }
          </h2>
          <button
            onClick={() => {
              setIsCreating(false);
              setEditingMachine(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to List
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machine Name *
                </label>
                <input
                  type="text"
                  value={currentData.name}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Brother DB2-B755-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machine Type *
                </label>
                <select
                  value={currentData.type}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {machineTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={currentData.brand}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brother, Juki, Singer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={currentData.model}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="DB2-B755-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={currentData.serialNumber}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Serial number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={currentData.purchaseDate}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={currentData.status}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="repair">Under Repair</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={currentData.location}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Floor 1, Section A, Position 12"
                />
              </div>
            </div>

            {/* Technical Specifications & Maintenance */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Technical Specifications</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Speed (RPM)
                  </label>
                  <input
                    type="number"
                    value={currentData.specifications.maxSpeed}
                    onChange={(e) => updateSpecification('maxSpeed', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Power (W)
                  </label>
                  <input
                    type="text"
                    value={currentData.specifications.power}
                    onChange={(e) => updateSpecification('power', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="550W"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Needle Type
                  </label>
                  <input
                    type="text"
                    value={currentData.specifications.needleType}
                    onChange={(e) => updateSpecification('needleType', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="DB×1 #14"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thread Count
                  </label>
                  <input
                    type="text"
                    value={currentData.specifications.threadCount}
                    onChange={(e) => updateSpecification('threadCount', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="40/2, 50/2"
                  />
                </div>
              </div>

              <h4 className="text-md font-medium text-gray-900 mt-6">Maintenance Schedule</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Frequency
                </label>
                <select
                  value={currentData.maintenanceSchedule}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, maintenanceSchedule: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Maintenance
                </label>
                <input
                  type="date"
                  value={currentData.lastMaintenance}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, lastMaintenance: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={currentData.notes}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about the machine..."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={editingMachine ? handleUpdateMachine : handleCreateMachine}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              {editingMachine ? 'Update Machine' : 'Add Machine'}
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingMachine(null);
              }}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-4">
          {onBack && (
            <BackButton 
              onClick={onBack} 
              text={currentLanguage === 'np' ? 'फिर्ता' : 'Back to Dashboard'} 
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {currentLanguage === 'np' ? '🔧 मेसिन व्यवस्थापन' : '🔧 Machine Management'}
          </h1>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {currentLanguage === 'np' ? '+ नयाँ मेसिन' : '+ Add Machine'}
        </button>
      </div>

      {/* Search and Filter Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search machines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterByType}
            onChange={(e) => setFilterByType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {machineTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          + Add New Machine
        </button>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMachines.map((machine) => (
          <div key={machine.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{machine.name}</h3>
                <p className="text-sm text-gray-600">{machine.type}</p>
                {machine.brand && (
                  <p className="text-sm text-gray-500">{machine.brand} {machine.model}</p>
                )}
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(machine.status)}`}>
                  {machine.status}
                </span>
                {isMaintenanceDue(machine) && (
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                    Maintenance Due
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Serial:</span>
                <span className="font-medium">{machine.serialNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{machine.location || 'N/A'}</span>
              </div>
              {machine.specifications && machine.specifications.maxSpeed && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Speed:</span>
                  <span className="font-medium">{machine.specifications.maxSpeed} RPM</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Next Maintenance:</span>
                <span className={`font-medium ${isMaintenanceDue(machine) ? 'text-red-600' : 'text-gray-900'}`}>
                  {machine.nextMaintenance ? new Date(machine.nextMaintenance).toLocaleDateString() : 'Not scheduled'}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setEditingMachine(machine)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteMachine(machine.id)}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>

            {machine.performance && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Performance:</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Efficiency:</span>
                    <span>{machine.performance.efficiency}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Total Hours:</span>
                    <span>{machine.performance.totalHours}h</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMachines.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No machines found</div>
          <button
            onClick={() => setIsCreating(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            Add your first machine
          </button>
        </div>
      )}

      {/* Maintenance Summary */}
      {machines.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Overview</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {machines.filter(m => m.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Machines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {machines.filter(m => m.status === 'maintenance').length}
              </div>
              <div className="text-sm text-gray-600">Under Maintenance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {machines.filter(m => isMaintenanceDue(m)).length}
              </div>
              <div className="text-sm text-gray-600">Maintenance Due</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {machines.filter(m => m.status === 'repair').length}
              </div>
              <div className="text-sm text-gray-600">Under Repair</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineManagement;