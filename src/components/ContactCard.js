import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContactCard({ contact, onPress }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleEmailPress = () => {
    const emailUrl = `mailto:${contact.contact_email}`;
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert(
            'Email not available',
            'Unable to open email client. Please copy the email address manually.',
            [
              {
                text: 'Copy Email',
                onPress: () => {
                  // In a real app, you'd use Clipboard API here
                  Alert.alert('Email Address', contact.contact_email);
                }
              },
              { text: 'OK' }
            ]
          );
        }
      })
      .catch((err) => console.error('Error opening email:', err));
  };

  const handleCardPress = () => {
    if (onPress) {
      onPress(contact);
    } else {
      // Default action - show contact options
      Alert.alert(
        contact.contact_name,
        'What would you like to do?',
        [
          {
            text: 'Send Email',
            onPress: handleEmailPress,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(contact.contact_name) }]}>
          <Text style={styles.initials}>{getInitials(contact.contact_name)}</Text>
        </View>

        {/* Contact Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{contact.contact_name}</Text>
          <Text style={styles.email}>{contact.contact_email}</Text>
          {contact.created_at && (
            <Text style={styles.date}>Added {formatDate(contact.created_at)}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEmailPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="mail-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  initials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginLeft: 8,
  },
});