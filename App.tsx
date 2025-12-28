import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import React from "react";
import { Provider } from "react-redux";
import { store } from "./src/store";
import TabNavigator from "./src/navigation/TabNavigator"; // to be added next
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export default function App() {
   const [fontsLoaded] = useFonts({
    Poppins: require('./src/assets/fonts/Poppins-Regular.ttf'),
    PoppinsBold: require('./src/assets/fonts/Poppins-Bold.ttf'),
    Montserrat: require('./src/assets/fonts/Montserrat-Regular.ttf'),
  });

  if (!fontsLoaded) return <View><Text>Loading...</Text></View>;
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <TabNavigator />
      </Provider>
    </SafeAreaProvider>
  );
}

