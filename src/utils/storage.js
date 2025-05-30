import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storing data
const STORAGE_KEYS = {
  JOURNAL_ENTRIES: 'journal_entries',
  CONTACTS: 'contacts',
  USER_ID: 'user_id',
};

// Journal Entry Storage
export const saveJournalEntries = async (entries) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving journal entries:', error);
  }
};

export const getJournalEntries = async () => {
  try {
    const entries = await AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    return entries ? JSON.parse(entries) : [];
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return [];
  }
};

export const addJournalEntry = async (entry) => {
  try {
    const entries = await getJournalEntries();
    const newEntry = {
      id: Date.now().toString(),
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    };
    entries.unshift(newEntry); // Add to beginning of array
    await saveJournalEntries(entries);
    return newEntry;
  } catch (error) {
    console.error('Error adding journal entry:', error);
    throw error;
  }
};

export const deleteJournalEntry = async (entryId) => {
  try {
    const entries = await getJournalEntries();
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    await saveJournalEntries(updatedEntries);
    return true;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
};

// Contact Storage
export const saveContacts = async (contacts) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving contacts:', error);
  }
};

export const getContacts = async () => {
  try {
    const contacts = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
    return contacts ? JSON.parse(contacts) : [];
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
};

export const addContact = async (contact) => {
  try {
    const contacts = await getContacts();
    const newContact = {
      id: Date.now().toString(),
      ...contact,
      created_at: new Date().toISOString(),
    };
    contacts.push(newContact);
    contacts.sort((a, b) => a.contact_name.localeCompare(b.contact_name));
    await saveContacts(contacts);
    return newContact;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
};

// User ID management
export const getUserId = async () => {
  try {
    let userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = '1'; // Default user ID for this demo
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return '1';
  }
};

// Clear all data (for testing)
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.JOURNAL_ENTRIES,
      STORAGE_KEYS.CONTACTS,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Initialize with sample data if no data exists
export const initializeSampleData = async () => {
  try {
    const entries = await getJournalEntries();
    const contacts = await getContacts();

    if (entries.length === 0) {
      const sampleEntries = [
        {
          id: '1',
          user_id: 1,
          entry_text: 'Had a great day today! Felt really productive and accomplished a lot of my goals.',
          mood_rating: 5,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        },
        {
          id: '2',
          user_id: 1,
          entry_text: 'Feeling a bit stressed about work deadlines, but trying to stay positive.',
          mood_rating: 3,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        },
        {
          id: '3',
          user_id: 1,
          entry_text: 'Spent quality time with family. Really helped me relax and recharge.',
          mood_rating: 4,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        },
      ];
      await saveJournalEntries(sampleEntries);
    }

    if (contacts.length === 0) {
      const sampleContacts = [
        {
          id: '1',
          user_id: 1,
          contact_name: 'Dr. Smith',
          contact_email: 'dr.smith@healthcare.com',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 1,
          contact_name: 'Sarah Johnson',
          contact_email: 'sarah.j@email.com',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_id: 1,
          contact_name: 'Mike Chen',
          contact_email: 'mike.chen@email.com',
          created_at: new Date().toISOString(),
        },
      ];
      await saveContacts(sampleContacts);
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};