import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useDispatch } from 'react-redux';
import { fetchUsers } from './action';

export default function App() {
  const [result] = React.useState<number | undefined>();

  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(fetchUsers());
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
