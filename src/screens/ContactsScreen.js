import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getContactsAPI } from '../services/api';
import ContactCard from '../components/ContactCard';

export default function ContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadContacts = async () => {
    try {
      setLoading(true);
      const fetchedContacts = await getContactsAPI();
      setContacts(fetchedContacts);
      setFilteredContacts(fetchedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, []);

  // Load contacts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [])
  );

  // Filter contacts based on search query
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.contact_name.toLowerCase().includes(query.toLowerCase()) ||
          contact.contact_email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  };

  const handleContactPress = (contact) => {
    Alert.alert(
      contact.contact_name,
      `Email: ${contact.contact_email}`,
      [
        {
          text: 'Send Email',
          onPress: () => {
            // In a real app, this would open the email client
            Alert.alert('Email', `Opening email client for ${contact.contact_email}`);
          },
        },
        {
          text: 'Edit',
          onPress: () => {
            // In a real app, this would open an edit contact screen
            Alert.alert('Edit Contact', 'Edit functionality coming soon!');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderContact = ({ item }) => (
    <ContactCard contact={item} onPress={handleContactPress} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No Contacts Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your first contact to start building your wellness network
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddContact')}
      >
        <Ionicons name="person-add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Add First Contact</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchResults = () => {
    if (searchQuery.trim() !== '' && filteredContacts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtitle}>
            No contacts match "{searchQuery}"
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Contacts</Text>
      <Text style={styles.headerSubtitle}>
        {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
        {searchQuery.trim() !== '' && ` matching "${searchQuery}"`}
      </Text>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {contacts.length > 0 && renderHeader()}

      {/* Search Bar */}
      {contacts.length > 0 && renderSearchBar()}

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          filteredContacts.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          contacts.length === 0 ? renderEmptyState() : renderSearchResults()
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddContact')}
        activeOpacity={0.8}
      >
        <Ionicons name="person-add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  list: {
    paddingTop: 10,
    paddingBottom: 100, // Space for FAB
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});