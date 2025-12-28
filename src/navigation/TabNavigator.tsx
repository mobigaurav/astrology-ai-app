// src/navigation/TabNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "../screens/HomeScreen";
import TarotScreen from "../screens/TarotScreen";
import AIChatScreen from "../screens/AIChatScreen";
import HoroscopeScreen from "../screens/HoroscopeScreen";
import NumerologyScreen from "../screens/NumerologyScreen";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#090815",
    card: "#0d0c1f",
    text: "#ffffff",
    border: "rgba(255,255,255,0.08)",
    primary: "#7c3aed",
  },
};

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const tabPadding = Math.max(insets.bottom, 10);

  return (
    <NavigationContainer theme={darkTheme}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: string;

            switch (route.name) {
              case "Home":
                iconName = "home";
                break;
              case "Zodiac":
                iconName = "planet";
                break;
              case "Numerology":
                iconName = "calculator";
                break;
              case "Tarot":
                iconName = "layers";
                break;
              case "AI Chat":
                iconName = "chatbubbles";
                break;
              default:
                iconName = "ellipse";
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#7c3aed",
          tabBarInactiveTintColor: "#8b8ca7",
          tabBarStyle: {
            backgroundColor: "#0d0c1f",
            borderTopColor: "rgba(255,255,255,0.06)",
            paddingBottom: tabPadding,
            paddingTop: 6,
            height: 54 + tabPadding,
          },
          headerShown: true,
          headerStyle: {
            backgroundColor: "#090815",
          },
          headerShadowVisible: false,
          headerTintColor: "#fff",
          headerTitleStyle: {
            color: "#fff",
            fontFamily: "PoppinsBold",
            fontSize: 16,
          },
          tabBarLabelStyle: {
            fontFamily: "PoppinsBold",
            fontSize: 11,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Zodiac" component={HoroscopeScreen} />
        <Tab.Screen name="Numerology" component={NumerologyScreen} />
        <Tab.Screen name="Tarot" component={TarotScreen} />
        <Tab.Screen name="AI Chat" component={AIChatScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default TabNavigator;
