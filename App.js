import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import JournalScreen from './src/screens/JournalScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import AddJournalEntryScreen from './src/screens/AddJournalEntryScreen';
import AddContactScreen from './src/screens/AddContactScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Journal Stack Navigator
function JournalStack() {
  return (
    <Stack.Navigator
      initialRouteName="JournalList"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="JournalList" 
        component={JournalScreen} 
        options={{ title: 'My Journal' }}
      />
      <Stack.Screen 
        name="AddJournalEntry" 
        component={AddJournalEntryScreen} 
        options={{ 
          title: 'New Entry',
          headerBackTitle: 'Journal'
        }}
      />
    </Stack.Navigator>
  );
}

// Contacts Stack Navigator
function ContactsStack() {
  return (
    <Stack.Navigator
      initialRouteName="ContactsList"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#34C759',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ContactsList" 
        component={ContactsScreen} 
        options={{ title: 'My Contacts' }}
      />
      <Stack.Screen 
        name="AddContact" 
        component={AddContactScreen} 
        options={{ 
          title: 'Add Contact',
          headerBackTitle: 'Contacts'
        }}
      />
    </Stack.Navigator>
  );
}

// Home Stack (for consistency and proper navigation)
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Home doesn't need header
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

// Main App with Tab Navigation
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Journal') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === 'Contacts') {
              iconName = focused ? 'people' : 'people-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen 
          name="Journal" 
          component={JournalStack}
          options={{ tabBarLabel: 'Journal' }}
        />
        <Tab.Screen 
          name="Contacts" 
          component={ContactsStack}
          options={{ tabBarLabel: 'Contacts' }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}