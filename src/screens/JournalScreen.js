import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getJournalEntriesAPI } from '../services/api';
import JournalEntry from '../components/JournalEntry';

export default function JournalScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const fetchedEntries = await getJournalEntriesAPI();
      setEntries(fetchedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Failed to load journal entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, []);

  // Load entries when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  const handleEntryPress = (entry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const formatFullDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getMoodEmoji = (rating) => {
    switch (rating) {
      case 5: return '😊';
      case 4: return '🙂';
      case 3: return '😐';
      case 2: return '😕';
      case 1: return '😢';
      default: return '❓';
    }
  };

  const getMoodLabel = (rating) => {
    switch (rating) {
      case 5: return 'Excellent';
      case 4: return 'Good';
      case 3: return 'Okay';
      case 2: return 'Poor';
      case 1: return 'Terrible';
      default: return 'Unknown';
    }
  };

  const renderEntry = ({ item }) => (
    <JournalEntry entry={item} onPress={handleEntryPress} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No Journal Entries Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start your wellness journey by creating your first entry
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddJournalEntry')}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Create First Entry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Journal Entries</Text>
      <Text style={styles.headerSubtitle}>
        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {entries.length > 0 && renderHeader()}

      {/* Journal Entries List */}
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddJournalEntry')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Entry Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEntry && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Journal Entry</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Entry Details */}
                <View style={styles.modalBody}>
                  <Text style={styles.modalDate}>
                    {formatFullDate(selectedEntry.timestamp)}
                  </Text>
                  
                  <View style={styles.modalMoodContainer}>
                    <Text style={styles.modalMoodEmoji}>
                      {getMoodEmoji(selectedEntry.mood_rating)}
                    </Text>
                    <Text style={styles.modalMoodText}>
                      Mood: {getMoodLabel(selectedEntry.mood_rating)}
                    </Text>
                  </View>

                  <Text style={styles.modalEntryText}>
                    {selectedEntry.entry_text}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#007AFF',
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
    backgroundColor: '#007AFF',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  modalMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalMoodEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  modalMoodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalEntryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});