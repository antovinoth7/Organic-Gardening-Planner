import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { auth } from './src/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ThemeProvider, useTheme, useThemeMode } from './src/theme';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { logAuthError, setErrorLogUserId } from './src/utils/errorLogging';
import { Alert } from 'react-native';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import TodayScreen from './src/screens/TodayScreen';
import PlantsScreen from './src/screens/PlantsScreen';
import PlantFormScreen from './src/screens/PlantFormScreen';
import PlantDetailScreen from './src/screens/PlantDetailScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import JournalScreen from './src/screens/JournalScreen';
import JournalFormScreen from './src/screens/JournalFormScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PlantStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PlantsList" component={PlantsScreen} />
    <Stack.Screen name="PlantDetail" component={PlantDetailScreen} />
    <Stack.Screen name="PlantForm" component={PlantFormScreen} />
  </Stack.Navigator>
);

const JournalStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="JournalList" component={JournalScreen} />
    <Stack.Screen name="JournalForm" component={JournalFormScreen} />
  </Stack.Navigator>
);

const AppTabs = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Plants') iconName = 'leaf';
          else if (route.name === 'Care Plan') iconName = 'calendar';
          else if (route.name === 'Journal') iconName = 'book';
          else if (route.name === 'Settings') iconName = 'settings';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.border,
        },
        headerShown: false,
      })}
    >
    <Tab.Screen name="Home" component={TodayScreen} />
    <Tab.Screen 
      name="Plants" 
      component={PlantStack}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          e.preventDefault();
          // Always reset to the root of Plants stack when tab is pressed
          navigation.navigate('Plants', { 
            screen: 'PlantsList',
            params: {},
          });
        },
      })}
    />
    <Tab.Screen name="Care Plan" component={CalendarScreen} />
    <Tab.Screen 
      name="Journal" 
      component={JournalStack}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          e.preventDefault();
          // Always reset to the root of Journal stack when tab is pressed
          navigation.navigate('Journal', { 
            screen: 'JournalList',
            params: {},
          });
        },
      })}
    />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
  );
};

const AppRoot = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const { resolvedMode } = useThemeMode();

  // Configure navigation theme
  const navigationTheme = {
    dark: resolvedMode === 'dark',
    colors: {
      primary: theme.primary,
      background: theme.background,
      card: theme.backgroundSecondary,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900' as const,
      },
    },
  };

  useEffect(() => {
    let isMounted = true;
    
    // Listen for auth state changes with error handling
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', user ? `Logged in as ${user.email}` : 'Logged out');
        setUser(user);
        setLoading(false);
        
        // Update error logging context
        setErrorLogUserId(user?.uid);
      },
      (error) => {
        if (!isMounted) return;
        
        console.error('Auth state change error:', error);
        logAuthError('Auth state listener error', error);
        setLoading(false);
        
        // Show user-friendly error
        Alert.alert(
          'Authentication Error',
          'There was a problem with your session. Please restart the app.',
          [{ text: 'OK' }]
        );
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) return null; // Show splash screen

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="AppTabs" component={AppTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppRoot />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

