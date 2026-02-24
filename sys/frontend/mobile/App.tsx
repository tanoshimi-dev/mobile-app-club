import React, {useEffect} from 'react';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {store} from './src/store';
import {loadStoredAuth} from './src/store/slices/authSlice';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  useEffect(() => {
    store.dispatch(loadStoredAuth());
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
