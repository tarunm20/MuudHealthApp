// src/services/api.js - Auto IP Detection Version
import * as Network from 'expo-network';
import {
  getJournalEntries,
  addJournalEntry,
  deleteJournalEntry,
  getContacts,
  addContact,
  getUserId,
} from '../utils/storage';

// Auto-detect computer IP or fallback options
let API_BASE_URL = null;

const getComputerIP = async () => {
  try {
    // Method 1: Try to get network info from Expo
    const networkState = await Network.getNetworkStateAsync();
    if (networkState.isConnected) {
      const ipAddress = await Network.getIpAddressAsync();
      console.log(`📱 Device IP: ${ipAddress}`);
      
      // Convert device IP to likely computer IP
      // If device is 192.168.1.123, computer is likely 192.168.1.1 or 192.168.1.100
      const segments = ipAddress.split('.');
      if (segments.length === 4) {
        const baseIP = `${segments[0]}.${segments[1]}.${segments[2]}`;
        
        // Try common computer IPs in the same subnet
        const commonEndings = ['1', '100', '101', '102', '2', '10', '50'];
        
        for (const ending of commonEndings) {
          const testIP = `${baseIP}.${ending}`;
          if (await testIPConnection(testIP)) {
            console.log(`✅ Found computer at: ${testIP}`);
            return testIP;
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Network detection failed:', error.message);
  }
  
  // Method 2: Try common IP ranges
  const commonRanges = [
    '192.168.1', '192.168.0', '10.0.0', '172.16.0'
  ];
  
  for (const range of commonRanges) {
    const commonIPs = ['1', '100', '101', '102', '2', '10'];
    for (const ending of commonIPs) {
      const testIP = `${range}.${ending}`;
      if (await testIPConnection(testIP)) {
        console.log(`✅ Found computer at: ${testIP}`);
        return testIP;
      }
    }
  }
  
  // Method 3: Fallback to localhost (works on web/simulator)
  console.log('🔄 Falling back to localhost');
  return 'localhost';
};

const testIPConnection = async (ip) => {
  try {
    const response = await fetch(`http://${ip}:3000/health`, {
      method: 'GET',
      timeout: 2000, // Quick timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Initialize API URL
const initializeAPI = async () => {
  if (!API_BASE_URL) {
    console.log('🔍 Auto-detecting backend server...');
    const computerIP = await getComputerIP();
    API_BASE_URL = `http://${computerIP}:3000`;
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
  }
  return API_BASE_URL;
};

// Simple API call function
const callAPI = async (endpoint, options = {}) => {
  try {
    const baseURL = await initializeAPI();
    const url = `${baseURL}${endpoint}`;
    
    console.log(`🔄 Calling API: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ API Success: ${url}`);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    
    console.log(`❌ API Failed: ${error.message}`);
    
    if (error.message.includes('Network request failed') || 
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend server. Make sure it\'s running and you\'re on the same network.');
    }
    
    throw error;
  }
};

// Journal API Functions
export const getJournalEntriesAPI = async () => {
  try {
    const userId = await getUserId();
    const result = await callAPI(`/journal/user/${userId}`);
    console.log(`📖 Got ${result.entries.length} entries from backend`);
    return result.entries;
  } catch (error) {
    console.log('📱 Using local storage for journal entries');
    return await getJournalEntries();
  }
};

export const createJournalEntryAPI = async (entryData) => {
  try {
    const userId = await getUserId();
    const requestData = {
      ...entryData,
      user_id: parseInt(userId),
    };

    const result = await callAPI('/journal/entry', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    console.log(`📝 Created entry ${result.entry_id} on backend`);
    return {
      id: result.entry_id,
      ...entryData,
      user_id: parseInt(userId),
      timestamp: result.timestamp || new Date().toISOString(),
    };
  } catch (error) {
    console.log('📱 Using local storage for journal entry');
    const userId = await getUserId();
    return await addJournalEntry({
      ...entryData,
      user_id: parseInt(userId),
    });
  }
};

export const deleteJournalEntryAPI = async (entryId) => {
  try {
    await callAPI(`/journal/entry/${entryId}`, {
      method: 'DELETE',
    });
    console.log(`🗑️ Deleted entry ${entryId} from backend`);
    return true;
  } catch (error) {
    console.log('📱 Using local storage for delete');
    return await deleteJournalEntry(entryId);
  }
};

// Contacts API Functions
export const getContactsAPI = async () => {
  try {
    const userId = await getUserId();
    const result = await callAPI(`/contacts/user/${userId}`);
    console.log(`👥 Got ${result.contacts.length} contacts from backend`);
    return result.contacts;
  } catch (error) {
    console.log('📱 Using local storage for contacts');
    return await getContacts();
  }
};

export const addContactAPI = async (contactData) => {
  try {
    const userId = await getUserId();
    const requestData = {
      ...contactData,
      user_id: parseInt(userId),
    };

    const result = await callAPI('/contacts/add', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    console.log(`👤 Created contact ${result.contact_id} on backend`);
    return {
      id: result.contact_id,
      ...contactData,
      user_id: parseInt(userId),
      created_at: result.created_at || new Date().toISOString(),
    };
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('409')) {
      throw new Error('A contact with this email already exists');
    }
    
    console.log('📱 Using local storage for contact');
    const userId = await getUserId();
    return await addContact({
      ...contactData,
      user_id: parseInt(userId),
    });
  }
};

// Test connection function
export const testConnection = async () => {
  try {
    const baseURL = await initializeAPI();
    const result = await callAPI('/health');
    return {
      success: true,
      message: 'Backend connected successfully!',
      url: baseURL,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Backend not available',
      error: error.message,
      url: API_BASE_URL || 'Not initialized',
    };
  }
};

// Manual IP override (if auto-detection fails)
export const setManualIP = (ip) => {
  API_BASE_URL = `http://${ip}:3000`;
  console.log(`🔧 Manual IP set: ${API_BASE_URL}`);
};

// Get current API URL
export const getCurrentAPIURL = () => API_BASE_URL;