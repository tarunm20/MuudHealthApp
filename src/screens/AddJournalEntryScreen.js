import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createJournalEntryAPI } from '../services/api';

export default function AddJournalEntryScreen({ navigation }) {
  const [entryText, setEntryText] = useState('');
  const [moodRating, setMoodRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moodOptions = [
    { value: 1, emoji: '😢', label: 'Terrible', color: '#F44336' },
    { value: 2, emoji: '😕', label: 'Poor', color: '#FF5722' },
    { value: 3, emoji: '😐', label: 'Okay', color: '#FF9800' },
    { value: 4, emoji: '🙂', label: 'Good', color: '#8BC34A' },
    { value: 5, emoji: '😊', label: 'Excellent', color: '#4CAF50' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!entryText.trim()) {
      Alert.alert('Missing Information', 'Please write something in your journal entry.');
      return;
    }

    if (moodRating === 0) {
      Alert.alert('Missing Information', 'Please select your mood rating.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Saving journal entry...', { entryText: entryText.trim(), moodRating });

      const newEntry = await createJournalEntryAPI({
        entry_text: entryText.trim(),
        mood_rating: moodRating,
      });

      console.log('Journal entry saved:', newEntry);

      // Show success message and navigate back
      Alert.alert(
        'Success! 🎉',
        'Your journal entry has been saved.',
        [
          {
            text: 'View Entries',
            onPress: () => {
              // Navigate back to journal list
              navigation.navigate('JournalList');
            },
          },
          {
            text: 'Add Another',
            onPress: () => {
              // Clear form for another entry
              setEntryText('');
              setMoodRating(0);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating journal entry:', error);
      Alert.alert(
        'Error',
        'Failed to save your journal entry. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const navigateBack = () => {
      // Try to go back first
      if (navigation.canGoBack()) {
        console.log('Going back to previous screen');
        navigation.goBack();
      } else {
        // If can't go back, navigate to journal list
        console.log('Cannot go back, navigating to journal list');
        navigation.navigate('JournalList');
      }
    };

    if (entryText.trim() || moodRating > 0) {
      Alert.alert(
        'Discard Entry?',
        'Are you sure you want to discard this journal entry?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: navigateBack,
          },
        ]
      );
    } else {
      navigateBack();
    }
  };

  const renderMoodSelector = () => (
    <View style={styles.moodContainer}>
      <Text style={styles.sectionTitle}>How are you feeling?</Text>
      <View style={styles.moodOptions}>
        {moodOptions.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            style={[
              styles.moodOption,
              moodRating === mood.value && {
                backgroundColor: mood.color + '20',
                borderColor: mood.color,
                borderWidth: 2,
              },
            ]}
            onPress={() => setMoodRating(mood.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                moodRating === mood.value && { color: mood.color, fontWeight: '600' },
              ]}
            >
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const isFormValid = entryText.trim() && moodRating > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Entry</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.saveButton,
              (!isFormValid || isSubmitting) && styles.saveButtonDisabled,
            ]}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.saveText,
                  (!isFormValid || isSubmitting) && styles.saveTextDisabled,
                ]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Mood Selector */}
        {renderMoodSelector()}

        {/* Journal Entry Input */}
        <View style={styles.entryContainer}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Write about your day, thoughts, feelings, or anything that's important to you..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={10}
            value={entryText}
            onChangeText={setEntryText}
            textAlignVertical="top"
            autoFocus
            editable={!isSubmitting}
          />
          <Text style={styles.characterCount}>{entryText.length} characters</Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={16} color="#FF9500" />
            <Text style={styles.tipTitle}>Writing Tips</Text>
          </View>
          <Text style={styles.tipText}>
            • Be honest about your feelings{'\n'}
            • Include specific details about your day{'\n'}
            • Note what you're grateful for{'\n'}
            • Write about challenges and how you handled them
          </Text>
        </View>

        {/* Debug info (remove in production) */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Debug: Entry length: {entryText.length}, Mood: {moodRating}, Valid: {isFormValid.toString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveTextDisabled: {
    color: '#999',
  },
  moodContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 1,
    marginHorizontal: 2,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  entryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  debugContainer: {
    backgroundColor: '#FFF3CD',
    margin: 20,
    marginTop: 0,
    padding: 10,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
  },
});