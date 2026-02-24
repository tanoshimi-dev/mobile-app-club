/**
 * Root Navigator
 * Single stack with all screens — uses imperative navigation (reset)
 * instead of conditional rendering for auth/main switching.
 */
import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import MainTabs from './MainTabs';
import ArticleDetailScreen from '../screens/main/ArticleDetailScreen';
import SearchScreen from '../screens/main/SearchScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ArticleDetail: {articleId: number};
  Search: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@auth/access_token')
      .then(token => setInitialRoute(token ? 'MainTabs' : 'Login'))
      .catch(() => setInitialRoute('Login'));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Article',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          headerShown: true,
          headerTitle: 'Search',
          animation: 'fade_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
