import * as React from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  ActivityIndicator,
  Button,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from './action';

interface RootState {
  users: any;
}

export default function App() {
  const { isLoading, users } = useSelector((state: RootState) => ({
    isLoading: state.users?.pending,
    users: state.users?.data || [],
  }));

  const dispatch = useDispatch();

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={users}
          keyExtractor={(item, index) => item + index}
          renderItem={({ item }) => (
            <View
              style={{
                height: 50,
                width: '100%',
                justifyContent: 'center',
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: 'grey',
              }}
            >
              <Text>{item.name}</Text>
            </View>
          )}
        />
      )}
      <Button title="Load Users" onPress={() => dispatch(fetchUsers())} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});
