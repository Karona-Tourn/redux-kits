import * as React from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from './action';

interface RootState {
  users: any;
}

export default function App() {
  const [refreshing, setRefreshing] = React.useState(false);
  const { isLoading, isFailLoading, users } = useSelector(
    (state: RootState) => ({
      isLoading: state.users.pending,
      isFailLoading: state.users.error ? true : false,
      users: state.users.data ?? [],
    })
  );

  const dispatch = useDispatch();

  const handleLoad = React.useCallback(() => {
    if (!isLoading) {
      dispatch(
        fetchUsers({
          limit: 100,
        })
      );
    }
  }, [isLoading, dispatch]);

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    handleLoad();
  }, [handleLoad]);

  React.useEffect(() => {
    handleLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!isLoading && refreshing) {
      setRefreshing(false);
    }
  }, [isLoading, refreshing]);

  const renderItem = React.useCallback(({ item }) => {
    return (
      <View style={styles.item}>
        <Image source={{ uri: item.picture.thumbnail }} style={styles.avatar} />
        <View>
          <Text>{`${item.name.title}. ${item.name.first} ${item.name.last}`}</Text>
          <Text style={styles.phoneText}>{item.phone}</Text>
        </View>
      </View>
    );
  }, []);

  const keyExtractor = React.useCallback((item, index) => item + index, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent={false} />
      {isLoading && !refreshing ? (
        <View style={styles.indicatorcontainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : isFailLoading ? (
        <View style={styles.indicatorcontainer}>
          <Text>Failed loading users</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleLoad}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={users}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      <Button title="Load Users" onPress={handleLoad} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  indicatorcontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    height: 60,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'grey',
    paddingHorizontal: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginEnd: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'grey',
  },
  phoneText: {
    color: 'grey',
    fontSize: 12,
    marginTop: 2,
  },
  retryButton: {
    marginTop: 10,
  },
  retryText: {
    fontWeight: '700',
  },
});
