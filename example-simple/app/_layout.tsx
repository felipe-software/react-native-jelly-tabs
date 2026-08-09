import "react-native-gesture-handler";

import { MaterialIcons } from "@react-native-vector-icons/material-icons";
import { Tabs } from "expo-router";
import { JellyTabBar } from "react-native-jelly-tabs";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f1e8" />
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <JellyTabBar {...props} floating />}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons color={color} name="home" size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: "Search",
              tabBarBadge: 3,
              tabBarBadgeStyle: {
                backgroundColor: "#f59e0b",
                color: "#451a03",
              },
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons color={color} name="search" size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarBadge: "9+",
              tabBarBadgeStyle: {
                backgroundColor: "#f05a3c",
                color: "#fff8ef",
              },
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons color={color} name="person" size={size} />
              ),
            }}
          />
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
