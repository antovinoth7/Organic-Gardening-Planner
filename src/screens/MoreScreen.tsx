import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { auth } from "../lib/firebase";
import { signOut } from "@firebase/auth";

export default function MoreScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to sign out");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.accountHeader}>
          <View style={styles.accountIcon}>
            <Ionicons name="person-circle" size={26} color={theme.primary} />
          </View>
          <View style={styles.accountText}>
            <Text style={styles.accountLabel}>Account</Text>
            <Text style={styles.accountEmail}>
              {auth.currentUser?.email || "Not signed in"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("ManageLocations")}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="location-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>Manage Garden Locations</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("ManagePlantCatalog")}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="list-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>Manage Plant Catalog</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Settings")}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="settings-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: 24,
      paddingTop: 48,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    accountHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    accountIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    accountText: {
      flex: 1,
    },
    accountLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 2,
    },
    accountEmail: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
  content: {
    padding: 16,
  },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
    },
    menuIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: 16,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.error,
      marginLeft: 8,
    },
  });
