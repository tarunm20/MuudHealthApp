import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getJournalEntriesAPI, getContactsAPI } from '../services/api';
import { initializeSampleData } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalEntries: 0,
    thisWeek: 0,
    totalContacts: 0,
    moodAverage: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // FIXED: Correct navigation paths
  const quickActions = [
    {
      id: 1,
      title: 'New Journal Entry',
      subtitle: 'Record your thoughts',
      icon: 'create-outline',
      color: '#007AFF',
      onPress: () => {
        console.log('Navigating to Add Journal Entry');
        navigation.navigate('Journal', { screen: 'AddJournalEntry' });
      },
    },
    {
      id: 2,
      title: 'Add Contact',
      subtitle: 'Connect with someone',
      icon: 'person-add-outline',
      color: '#34C759',
      onPress: () => {
        console.log('Navigating to Add Contact');
        navigation.navigate('Contacts', { screen: 'AddContact' });
      },
    },
    {
      id: 3,
      title: 'View Journal',
      subtitle: 'Read past entries',
      icon: 'book-outline',
      color: '#FF9500',
      onPress: () => {
        console.log('Navigating to Journal List');
        // Navigate to the Journal tab, then to the JournalList screen
        navigation.navigate('Journal', { screen: 'JournalList' });
      },
    },
    {
      id: 4,
      title: 'My Contacts',
      subtitle: 'Manage connections',
      icon: 'people-outline',
      color: '#AF52DE',
      onPress: () => {
        console.log('Navigating to Contacts List');
        // Navigate to the Contacts tab, then to the ContactsList screen
        navigation.navigate('Contacts', { screen: 'ContactsList' });
      },
    },
  ];

  const loadStats = async () => {
    try {
      // Initialize sample data if needed
      await initializeSampleData();

      // Get journal entries and calculate stats
      const entries = await getJournalEntriesAPI();
      const contacts = await getContactsAPI();

      // Calculate this week's entries
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const thisWeekEntries = entries.filter(entry => 
        new Date(entry.timestamp) > oneWeekAgo
      );

      // Calculate average mood
      const moodAverage = entries.length > 0 
        ? entries.reduce((sum, entry) => sum + entry.mood_rating, 0) / entries.length
        : 0;

      setStats({
        totalEntries: entries.length,
        thisWeek: thisWeekEntries.length,
        totalContacts: contacts.length,
        moodAverage: Number(moodAverage.toFixed(1)),
      });

      console.log('Stats loaded:', {
        totalEntries: entries.length,
        thisWeek: thisWeekEntries.length,
        totalContacts: contacts.length,
        moodAverage: Number(moodAverage.toFixed(1)),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, []);

  // Load stats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const getMoodEmoji = (rating) => {
    if (rating >= 4.5) return '😊';
    if (rating >= 3.5) return '🙂';
    if (rating >= 2.5) return '😐';
    if (rating >= 1.5) return '😕';
    return '😢';
  };

  const getWellnessTip = () => {
    const tips = [
      "Taking just 5 minutes to reflect on your day can improve your mental clarity and emotional awareness.",
      "Regular journaling has been shown to reduce stress and improve overall well-being.",
      "Connecting with others and maintaining relationships is crucial for mental health.",
      "Remember to celebrate small wins - they add up to big achievements!",
      "Deep breathing exercises can help you feel more centered and focused.",
      "Getting enough sleep is one of the best things you can do for your mental health.",
      "Physical exercise, even a short walk, can significantly boost your mood.",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>MUUD Health</Text>
        <Text style={styles.subtitle}>Your wellness companion</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}
            onPress={() => navigation.navigate('Journal', { screen: 'JournalList' })}
          >
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}
            onPress={() => navigation.navigate('Journal', { screen: 'JournalList' })}
          >
            <Text style={styles.statNumber}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}
            onPress={() => navigation.navigate('Contacts', { screen: 'ContactsList' })}
          >
            <Text style={styles.statNumber}>{stats.totalContacts}</Text>
            <Text style={styles.statLabel}>Contacts</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <View style={styles.moodContainer}>
              <Text style={styles.statNumber}>{stats.moodAverage}</Text>
              <Text style={styles.moodEmoji}>{getMoodEmoji(stats.moodAverage)}</Text>
            </View>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Daily Tip */}
      <View style={styles.tipContainer}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb-outline" size={20} color="#FF9500" />
          <Text style={styles.tipTitle}>Daily Wellness Tip</Text>
        </View>
        <Text style={styles.tipText}>{getWellnessTip()}</Text>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 0.48,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  moodEmoji: {
    fontSize: 24,
    marginLeft: 8,
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tipContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});