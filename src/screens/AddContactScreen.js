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
import { addContactAPI } from '../services/api';

export default function AddContactScreen({ navigation }) {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (!contactName.trim()) {
      Alert.alert('Missing Information', 'Please enter a contact name.');
      return;
    }

    if (!contactEmail.trim()) {
      Alert.alert('Missing Information', 'Please enter an email address.');
      return;
    }

    if (!validateEmail(contactEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Adding contact...', { contactName: contactName.trim(), contactEmail: contactEmail.trim() });

      const newContact = await addContactAPI({
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim().toLowerCase(),
      });

      console.log('Contact added:', newContact);

      Alert.alert(
        'Success! 🎉',
        `${contactName.trim()} has been added to your contacts.`,
        [
          {
            text: 'View Contacts',
            onPress: () => {
              // Navigate back to contacts list
              navigation.navigate('ContactsList');
            },
          },
          {
            text: 'Add Another',
            onPress: () => {
              // Clear form for another contact
              setContactName('');
              setContactEmail('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating contact:', error);
      
      // Check if it's a duplicate email error
      if (error.message && error.message.includes('already exists')) {
        Alert.alert(
          'Duplicate Contact',
          'A contact with this email address already exists.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to add contact. Please try again.',
          [{ text: 'OK' }]
        );
      }
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
        // If can't go back, navigate to contacts list
        console.log('Cannot go back, navigating to contacts list');
        navigation.navigate('ContactsList');
      }
    };

    if (contactName.trim() || contactEmail.trim()) {
      Alert.alert(
        'Discard Contact?',
        'Are you sure you want to discard this contact?',
        [
          { text: 'Keep Editing', style: 'cancel' },
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

  const isFormValid = contactName.trim() && contactEmail.trim() && validateEmail(contactEmail.trim());

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
          <Text style={styles.headerTitle}>Add Contact</Text>
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
                Add
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Contact Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter contact name"
                placeholderTextColor="#999"
                value={contactName}
                onChangeText={setContactName}
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter email address"
                placeholderTextColor="#999"
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
            </View>
            {contactEmail.trim() && !validateEmail(contactEmail.trim()) && (
              <Text style={styles.errorText}>Please enter a valid email address</Text>
            )}
          </View>
        </View>

        {/* Contact Types */}
        <View style={styles.tipContainer}>
          <View style={styles.tipHeader}>
            <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
            <Text style={styles.tipTitle}>About Contacts</Text>
          </View>
          <Text style={styles.tipText}>
            Add healthcare providers, therapists, support group members, family, and friends to build your wellness network. You can easily reach out to them when you need support.
          </Text>
        </View>

        {/* Quick Add Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick Add Suggestions</Text>
          <View style={styles.suggestionsList}>
            {[
              { icon: 'medical-outline', text: 'Healthcare Provider', color: '#FF6B6B' },
              { icon: 'heart-outline', text: 'Therapist/Counselor', color: '#4ECDC4' },
              { icon: 'people-outline', text: 'Support Group', color: '#45B7D1' },
              { icon: 'home-outline', text: 'Family Member', color: '#96CEB4' },
              { icon: 'happy-outline', text: 'Friend', color: '#FFEAA7' },
            ].map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => {
                  // This could auto-fill some template text or just be informational
                }}
              >
                <View style={[styles.suggestionIcon, { backgroundColor: suggestion.color + '20' }]}>
                  <Ionicons name={suggestion.icon} size={16} color={suggestion.color} />
                </View>
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Debug info (remove in production) */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Debug: Name: "{contactName}", Email: "{contactEmail}", Valid: {isFormValid.toString()}
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
    backgroundColor: '#34C759',
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
  formContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  tipContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
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
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  suggestionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
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