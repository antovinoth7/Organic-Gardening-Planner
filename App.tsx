import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { auth } from "./src/lib/firebase";
import { onAuthStateChanged, User } from "@firebase/auth";
import { ThemeProvider, useTheme, useThemeMode } from "./src/theme";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { logAuthError, setErrorLogUserId } from "./src/utils/errorLogging";
import { initAppLifecycle } from "./src/utils/appLifecycle";
import { Alert, Platform } from "react-native";
import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";
import { migrateImagesToMediaLibrary } from "./src/lib/imageStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Screens
import AuthScreen from "./src/screens/AuthScreen";
import TodayScreen from "./src/screens/TodayScreen";
import PlantsScreen from "./src/screens/PlantsScreen";
import ArchivedPlantsScreen from "./src/screens/ArchivedPlantsScreen";
import PlantFormScreen from "./src/screens/PlantFormScreen";
import PlantDetailScreen from "./src/screens/PlantDetailScreen";
import CalendarScreen from "./src/screens/CalendarScreen";
import JournalScreen from "./src/screens/JournalScreen";
import JournalFormScreen from "./src/screens/JournalFormScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import MoreScreen from "./src/screens/MoreScreen";
import ManageLocationsScreen from "./src/screens/ManageLocationsScreen";
import ManagePlantCatalogScreen from "./src/screens/ManagePlantCatalogScreen";

const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<
  string,
  unknown
>;
const sentryDsnFromExtra =
  typeof expoExtra["sentryDsn"] === "string"
    ? (expoExtra["sentryDsn"] as string)
    : undefined;
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN || sentryDsnFromExtra;
const captureConsoleBreadcrumbs =
  process.env.EXPO_PUBLIC_SENTRY_CAPTURE_CONSOLE === "1" ||
  expoExtra["sentryCaptureConsole"] === "1" ||
  expoExtra["sentryCaptureConsole"] === true;
const isDev = __DEV__;

// Only log Sentry config in development
if (isDev) {
  console.log("🔧 Sentry DSN loaded:", sentryDsn ? "YES" : "NO");
  console.log("🔧 Environment:", isDev ? "development" : "production");
}

Sentry.init({
  dsn: sentryDsn,
  enabled: !!sentryDsn,
  debug: isDev, // Debug logs only in development

  // Performance Monitoring
  tracesSampleRate: isDev ? 1.0 : 0.2, // 100% in dev, 20% in prod
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 10000,

  // Environment
  environment: isDev ? "development" : "production",

  // Native crash handling
  enableNative: true,
  enableNativeCrashHandling: true,

  // Breadcrumbs - track user actions
  maxBreadcrumbs: 50,

  // Data scrubbing for privacy
  beforeSend(event, _hint) {
    // Remove sensitive data
    if (event.request?.headers) {
      delete event.request.headers["Authorization"];
      delete event.request.headers["Cookie"];
    }

    // Filter out sensitive user data
    if (event.user?.email) {
      event.user.email = event.user.email.replace(/(.{2}).*@/, "$1***@");
    }

    // Add image-related context for debugging native crashes
    if (event.exception?.values?.[0]) {
      const errorValue = event.exception.values[0].value?.toLowerCase() || '';
      const errorType = event.exception.values[0].type?.toLowerCase() || '';
      
      if (errorValue.includes('abort') || errorValue.includes('shadownode') || 
          errorType.includes('scudo') || errorValue.includes('image')) {
        event.tags = event.tags || {};
        event.tags['likely_image_related'] = 'true';
        event.contexts = event.contexts || {};
        event.contexts['image_info'] = {
          note: 'Native crash likely related to image memory management',
          mitigation: 'Using expo-image and stale URI detection',
        };
      }
    }

    // Log in development only
    if (isDev) {
      console.log("📤 Sentry event:", {
        eventId: event.event_id,
        level: event.level,
        message: event.message,
        exception: event.exception?.values?.[0]?.value,
      });
    }

    return event;
  },

  // Filter noisy breadcrumbs
  beforeBreadcrumb(breadcrumb, _hint) {
    // Skip console logs in production
    if (!isDev && !captureConsoleBreadcrumbs && breadcrumb.category === "console") {
      return null;
    }
    return breadcrumb;
  },

  // Ignore known non-critical errors
  ignoreErrors: [
    "Network request failed",
    "cancelled",
    /timeout of \d+ms exceeded/,
    // Known Android native memory issues that expo-image should prevent
    "Abort abort", // Native memory corruption
    /ShadowNode/i, // React Native shadow node issues
    /Scudo/i, // Android memory allocator errors
  ],
});

if (isDev) {
  console.log("✅ Sentry initialized");
}

// Global error handlers to prevent silent crashes
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('🔴 Global error caught:', {
      error: error?.message || error,
      stack: error?.stack,
      isFatal,
    });
    
    // Send to Sentry
    Sentry.captureException(error, {
      tags: { fatal: isFatal ? 'true' : 'false' },
    });
    
    // Call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Handle unhandled promise rejections
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rejectionTracking = require('promise/setimmediate/rejection-tracking');
rejectionTracking.enable({
  allRejections: true,
  onUnhandled: (id: string, error: Error) => {
    console.error('🔴 Unhandled promise rejection:', {
      id,
      error: error?.message || error,
      stack: error?.stack,
    });
    
    // Send to Sentry
    Sentry.captureException(error, {
      tags: { type: 'unhandled_promise_rejection' },
    });
  },
  onHandled: (id: string) => {
    if (isDev) {
      console.log('✅ Promise rejection handled:', id);
    }
  },
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PlantStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PlantsList" component={PlantsScreen} />
    <Stack.Screen name="ArchivedPlants" component={ArchivedPlantsScreen} />
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

const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MoreHome" component={MoreScreen} />
    <Stack.Screen name="ManageLocations" component={ManageLocationsScreen} />
    <Stack.Screen
      name="ManagePlantCatalog"
      component={ManagePlantCatalogScreen}
    />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

const AppTabs = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Plants") iconName = "leaf";
          else if (route.name === "Care Plan") iconName = "calendar";
          else if (route.name === "Journal") iconName = "book";
          else if (route.name === "More") iconName = "ellipsis-vertical";
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
            navigation.navigate("Plants", {
              screen: "PlantsList",
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
            navigation.navigate("Journal", {
              screen: "JournalList",
              params: {},
            });
          },
        })}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("More", {
              screen: "MoreHome",
              params: {},
            });
          },
        })}
      />
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
    dark: resolvedMode === "dark",
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
        fontFamily: "System",
        fontWeight: "400" as const,
      },
      medium: {
        fontFamily: "System",
        fontWeight: "500" as const,
      },
      bold: {
        fontFamily: "System",
        fontWeight: "700" as const,
      },
      heavy: {
        fontFamily: "System",
        fontWeight: "900" as const,
      },
    },
  };

  useEffect(() => {
    let isMounted = true;
    let lastAlertTime = 0;
    const ALERT_DEBOUNCE_MS = 30000; // 30 seconds between alerts

    // Initialize app lifecycle management for memory cleanup
    const cleanupLifecycle = initAppLifecycle();

    // Run image migration once on Android
    const runImageMigration = async () => {
      if (Platform.OS !== 'android') return;
      
      try {
        // Check if migration has already run
        const migrationComplete = await AsyncStorage.getItem('@image_migration_complete');
        if (migrationComplete === 'true') {
          console.log('Image migration already completed');
          return;
        }

        console.log('Starting image migration to MediaLibrary...');
        const result = await migrateImagesToMediaLibrary();
        
        if (result.success || result.migratedCount > 0) {
          console.log('✅ Migration completed:', result.message);
          if (result.completed) {
            await AsyncStorage.setItem('@image_migration_complete', 'true');
          }
          
          if (result.migratedCount > 0) {
            Alert.alert(
              'Images Updated',
              `${result.migratedCount} image(s) moved to persistent storage. Your photos will now survive app reinstalls.`,
              [{ text: 'OK' }]
            );
          }
        } else if (!result.success) {
          console.warn('⚠️ Migration had issues:', result.message);
        }
      } catch (error) {
        console.error('Migration error:', error);
      }
    };

    // Listen for auth state changes with error handling
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!isMounted) return;

        if (isDev) {
          console.log(
            "Auth state changed:",
            user ? `Logged in as ${user.email}` : "Logged out"
          );
        }
        setUser(user);
        setLoading(false);

        // Update error logging context
        setErrorLogUserId(user?.uid);

        // Set Sentry user context
        if (user) {
          Sentry.setUser({
            id: user.uid,
            email: user.email || undefined,
          });
          Sentry.setTag("user_authenticated", "true");
          
          // Run migration after successful authentication
          runImageMigration();
        } else {
          Sentry.setUser(null);
          Sentry.setTag("user_authenticated", "false");
        }
      },
      (error) => {
        if (!isMounted) return;

        console.error("Auth state change error:", error);
        logAuthError("Auth state listener error", error);
        setLoading(false);

        // Handle network errors silently - just show login screen
        const errorCode = (error as any)?.code;
        if (errorCode === 'auth/network-request-failed') {
          setUser(null);
          return;
        }

        // Debounce alerts to prevent spam
        const now = Date.now();
        if (now - lastAlertTime > ALERT_DEBOUNCE_MS) {
          lastAlertTime = now;
          Alert.alert(
            "Authentication Error",
            "There was a problem with your session. Please sign in again.",
            [{ text: "OK" }]
          );
        }
        
        // Sign out user on persistent auth errors
        setUser(null);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
      cleanupLifecycle();
    };
  }, []);

  if (loading) return null; // Show splash screen

  return (
    <>
      <StatusBar
        style={resolvedMode === "dark" ? "light" : "dark"}
        backgroundColor={theme.backgroundSecondary}
        translucent={false}
      />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="AppTabs" component={AppTabs} />
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppRoot />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(App);
