import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function JournalEntry({ entry, onPress, onDelete }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getMoodColor = (rating) => {
    switch (rating) {
      case 5: return '#4CAF50'; // Green
      case 4: return '#8BC34A'; // Light Green
      case 3: return '#FF9800'; // Orange
      case 2: return '#FF5722'; // Red Orange
      case 1: return '#F44336'; // Red
      default: return '#9E9E9E'; // Gray
    }
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

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete && onDelete(entry),
        },
      ]
    );
  };

  const handleLongPress = () => {
    Alert.alert(
      'Journal Entry Options',
      'What would you like to do with this entry?',
      [
        {
          text: 'View Full Entry',
          onPress: () => onPress && onPress(entry),
        },
        {
          text: 'Delete Entry',
          style: 'destructive',
          onPress: handleDelete,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress && onPress(entry)}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Header with date and mood (no delete button) */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(entry.timestamp)}</Text>
          <Text style={styles.time}>{formatTime(entry.timestamp)}</Text>
        </View>
        <View style={[styles.moodContainer, { backgroundColor: getMoodColor(entry.mood_rating) + '20' }]}>
          <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood_rating)}</Text>
          <Text style={[styles.moodText, { color: getMoodColor(entry.mood_rating) }]}>
            {getMoodLabel(entry.mood_rating)}
          </Text>
        </View>
      </View>

      {/* Entry text */}
      <Text style={styles.entryText}>
        {truncateText(entry.entry_text)}
      </Text>

      {/* Footer with read more indicator */}
      {entry.entry_text.length > 120 && (
        <View style={styles.footer}>
          <Text style={styles.readMore}>Tap to read more • Long press for options</Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </View>
      )}
      
      {/* If entry is short, show long press hint */}
      {entry.entry_text.length <= 120 && (
        <View style={styles.footer}>
          <Text style={styles.readMore}>Long press for options</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  moodEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  readMore: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
});