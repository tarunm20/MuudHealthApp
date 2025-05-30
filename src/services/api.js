// Complete API Service for MUUD Health - Backend Connection
// src/services/api.js

import {
  getJournalEntries,
  addJournalEntry,
  deleteJournalEntry,
  getContacts,
  addContact,
  getUserId,
} from '../utils/storage';

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Your backend URL
const USE_BACKEND = true; // Set to false to use local storage only
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Helper function for API calls with timeout and error handling
const apiCall = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`);
    
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    
    // Network error or backend unavailable
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to server. Please ensure the backend is running on http://localhost:3000');
    }
    
    console.error(`❌ API Error: ${options.method || 'GET'} ${url} - ${error.message}`);
    throw error;
  }
};

// Helper function to simulate network delay (for development)
const simulateNetworkDelay = (ms = 200) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Journal API
export const journalAPI = {
  // Get all journal entries for the current user
  getEntries: async () => {
    if (!USE_BACKEND) {
      await simulateNetworkDelay();
      return await getJournalEntries();
    }

    try {
      const userId = await getUserId();
      const data = await apiCall(`${API_BASE_URL}/journal/user/${userId}`);
      
      if (data.success) {
        console.log(`📖 Retrieved ${data.entries.length} journal entries from backend`);
        return data.entries;
      } else {
        throw new Error(data.message || 'Failed to fetch entries');
      }
    } catch (error) {
      console.error('❌ Error fetching journal entries from backend:', error.message);
      
      // Fallback to local storage
      console.log('🔄 Falling back to local storage...');
      return await getJournalEntries();
    }
  },

  // Create a new journal entry
  createEntry: async (entryData) => {
    if (!USE_BACKEND) {
      await simulateNetworkDelay();
      const userId = await getUserId();
      const entry = {
        ...entryData,
        user_id: parseInt(userId),
      };
      return await addJournalEntry(entry);
    }

    try {
      const userId = await getUserId();
      
      const requestData = {
        ...entryData,
        user_id: parseInt(userId),
        timestamp: new Date().toISOString(),
      };

      const data = await apiCall(`${API_BASE_URL}/journal/entry`, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (data.success) {
        console.log(`📝 Created journal entry on backend (ID: ${data.entry_id})`);
        
        // Return the entry in the format expected by the frontend
        return {
          id: data.entry_id,
          ...entryData,
          user_id: parseInt(userId),
          timestamp: data.timestamp || new Date().toISOString(),
        };
      } else {
        throw new Error(data.message || 'Failed to create entry');
      }
    } catch (error) {
      console.error('❌ Error creating journal entry on backend:', error.message);
      
      // Fallback to local storage
      console.log('🔄 Falling back to local storage...');
      const userId = await getUserId();
      const entry = {
        ...entryData,
        user_id: parseInt(userId),
      };
      return await addJournalEntry(entry);
    }
  },

  // Delete a journal entry
  deleteEntry: async (entryId) => {
    if (!USE_BACKEND) {
      await simulateNetworkDelay();
      return await deleteJournalEntry(entryId);
    }

    try {
      const data = await apiCall(`${API_BASE_URL}/journal/entry/${entryId}`, {
        method: 'DELETE',
      });

      if (data.success) {
        console.log(`🗑️ Deleted journal entry ${entryId} from backend`);
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('❌ Error deleting journal entry from backend:', error.message);
      
      // Fallback to local storage
      console.log('🔄 Falling back to local storage...');
      return await deleteJournalEntry(entryId);
    }
  },
};

// Contacts API
export const contactsAPI = {
  // Get all contacts for the current user
  getContacts: async () => {
    if (!USE_BACKEND) {
      await simulateNetworkDelay();
      return await getContacts();
    }

    try {
      const userId = await getUserId();
      const data = await apiCall(`${API_BASE_URL}/contacts/user/${userId}`);
      
      if (data.success) {
        console.log(`👥 Retrieved ${data.contacts.length} contacts from backend`);
        return data.contacts;
      } else {
        throw new Error(data.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      console.error('❌ Error fetching contacts from backend:', error.message);
      
      // Fallback to local storage
      console.log('🔄 Falling back to local storage...');
      return await getContacts();
    }
  },

  // Add a new contact
  addContact: async (contactData) => {
    if (!USE_BACKEND) {
      await simulateNetworkDelay();
      const userId = await getUserId();
      const contact = {
        ...contactData,
        user_id: parseInt(userId),
      };
      return await addContact(contact);
    }

    try {
      const userId = await getUserId();
      
      const requestData = {
        ...contactData,
        user_id: parseInt(userId),
      };

      const data = await apiCall(`${API_BASE_URL}/contacts/add`, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (data.success) {
        console.log(`👤 Added contact on backend (ID: ${data.contact_id})`);
        
        // Return the contact in the format expected by the frontend
        return {
          id: data.contact_id,
          ...contactData,
          user_id: parseInt(userId),
          created_at: data.created_at || new Date().toISOString(),
        };
      } else {
        throw new Error(data.message || 'Failed to add contact');
      }
    } catch (error) {
      console.error('❌ Error adding contact on backend:', error.message);
      
      // Check if it's a duplicate error
      if (error.message.includes('already exists')) {
        throw error; // Re-throw duplicate errors to show user
      }
      
      // Fallback to local storage for other errors
      console.log('🔄 Falling back to local storage...');
      const userId = await getUserId();
      const contact = {
        ...contactData,
        user_id: parseInt(userId),
      };
      return await addContact(contact);
    }
  },
};

// Health check API
export const healthAPI = {
  checkStatus: async () => {
    if (!USE_BACKEND) {
      return {
        success: true,
        message: 'Running in local storage mode',
        storage: 'local',
      };
    }

    try {
      const data = await apiCall(`${API_BASE_URL}/health`);
      console.log('🏥 Backend health check passed');
      return data;
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
      return {
        success: false,
        message: 'Backend unavailable - using local storage fallback',
        storage: 'local',
        error: error.message,
      };
    }
  },
};

// Connection test function
export const testConnection = async () => {
  try {
    console.log('🧪 Testing backend connection...');
    const health = await healthAPI.checkStatus();
    
    if (health.success) {
      console.log('✅ Backend connection successful');
      return {
        connected: true,
        message: 'Connected to backend successfully',
        details: health,
      };
    } else {
      console.log('⚠️ Backend connection failed, using local storage');
      return {
        connected: false,
        message: 'Backend unavailable, using local storage',
        details: health,
      };
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return {
      connected: false,
      message: 'Connection test failed',
      error: error.message,
    };
  }
};

// Utility function to switch between backend and local mode
export const setBackendMode = (useBackend) => {
  USE_BACKEND = useBackend;
  console.log(`🔧 API mode changed to: ${useBackend ? 'Backend' : 'Local Storage'}`);
};

// Export individual functions for convenience (these now use backend)
export const getJournalEntriesAPI = journalAPI.getEntries;
export const createJournalEntryAPI = journalAPI.createEntry;
export const deleteJournalEntryAPI = journalAPI.deleteEntry;
export const getContactsAPI = contactsAPI.getContacts;
export const addContactAPI = contactsAPI.addContact;