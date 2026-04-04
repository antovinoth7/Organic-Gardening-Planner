import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { TAB_BAR_HEIGHT } from "../components/FloatingTabBar";
import { auth } from "../lib/firebase";
import { signOut } from "@firebase/auth";
import { invalidateAll } from "../lib/dataCache";
import { createStyles } from "../styles/moreStyles";
import { useNavigation, NavigationProp, ParamListBase } from "@react-navigation/native";
import { getErrorMessage } from "../utils/errorLogging";

export default function MoreScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const handleSignOut = async () => {
    try {
      invalidateAll();
      await signOut(auth);
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error) || "Failed to sign out");
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.accountHeader}>
          <View style={styles.accountIcon}>
            <Ionicons name="person-circle" size={26} color="#fff" />
          </View>
          <View style={styles.accountText}>
            <Text style={styles.accountLabel}>Account</Text>
            <Text style={styles.accountEmail}>
              {auth.currentUser?.email || "Not signed in"}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16 },
        ]}
      >
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

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
