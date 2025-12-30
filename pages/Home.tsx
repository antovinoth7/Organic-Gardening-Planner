import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";

const Home = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
    // navigation.navigate("Login" as never);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Organic Gardening Planner!</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Home;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f4c3",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#33691e",
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#d32f2f",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
