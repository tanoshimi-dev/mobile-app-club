/**
 * App Stack Navigator
 * Main navigation stack for authenticated users
 */
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import ArticleDetailScreen from '../screens/main/ArticleDetailScreen';
import SearchScreen from '../screens/main/SearchScreen';

export type AppStackParamList = {
  MainTabs: undefined;
  ArticleDetail: {articleId: number};
  Search: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
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

export default AppStack;
