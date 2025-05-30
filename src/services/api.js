// API Service for MUUD Health
// This will use local storage for now, but can be easily switched to real API calls

import {
  getJournalEntries,
  addJournalEntry,
  deleteJournalEntry,
  getContacts,
  addContact,
  getUserId,
} from '../utils/storage';

// Base configuration
const API_BASE_URL = 'http://localhost:3000'; // Your backend URL
const USE_LOCAL_STORAGE = true; // Set to false when backend is ready

// Helper function to simulate network delay
const simulateNetworkDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Journal API
export const journalAPI = {
  // Get all journal entries for the current user
  getEntries: async () => {
    if (USE_LOCAL_STORAGE) {
      await simulateNetworkDelay();
      return await getJournalEntries();
    }

    try {
      const userId = await getUserId();
      const response = await fetch(`${API_BASE_URL}/journal/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.entries;
      } else {
        throw new Error(data.message || 'Failed to fetch entries');
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      // Fallback to local storage
      return await getJournalEntries();
    }
  },

  // Create a new journal entry
  createEntry: async (entryData) => {
    if (USE_LOCAL_STORAGE) {
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
      const response = await fetch(`${API_BASE_URL}/journal/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entryData,
          user_id: parseInt(userId),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          id: data.entry_id,
          ...entryData,
          user_id: parseInt(userId),
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(data.message || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating journal entry:', error);
      // Fallback to local storage
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
    if (USE_LOCAL_STORAGE) {
      await simulateNetworkDelay();
      return await deleteJournalEntry(entryId);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/journal/entry/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      // Fallback to local storage
      return await deleteJournalEntry(entryId);
    }
  },
};

// Contacts API
export const contactsAPI = {
  // Get all contacts for the current user
  getContacts: async () => {
    if (USE_LOCAL_STORAGE) {
      await simulateNetworkDelay();
      return await getContacts();
    }

    try {
      const userId = await getUserId();
      const response = await fetch(`${API_BASE_URL}/contacts/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.contacts;
      } else {
        throw new Error(data.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      // Fallback to local storage
      return await getContacts();
    }
  },

  // Add a new contact
  addContact: async (contactData) => {
    if (USE_LOCAL_STORAGE) {
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
      const response = await fetch(`${API_BASE_URL}/contacts/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactData,
          user_id: parseInt(userId),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          id: data.contact_id,
          ...contactData,
          user_id: parseInt(userId),
          created_at: new Date().toISOString(),
        };
      } else {
        throw new Error(data.message || 'Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      // Fallback to local storage
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
    if (USE_LOCAL_STORAGE) {
      return {
        success: true,
        message: 'Running in local storage mode',
        storage: 'local',
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        message: 'Backend unavailable - using local storage',
        storage: 'local',
      };
    }
  },
};

// Utility to switch between local and API mode
export const setAPIMode = (useAPI) => {
  USE_LOCAL_STORAGE = !useAPI;
};

// Export individual functions for convenience
export const getJournalEntriesAPI = journalAPI.getEntries;
export const createJournalEntryAPI = journalAPI.createEntry;
export const deleteJournalEntryAPI = journalAPI.deleteEntry;
export const getContactsAPI = contactsAPI.getContacts;
export const addContactAPI = contactsAPI.addContact;