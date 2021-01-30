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
  Alert,
} from 'react-native';
import { useAsyncReducerEffect } from 'redux-kits';
import { useDispatch } from 'react-redux';
import { fetchUsers, fetchRandomUsers } from './action';
import { useState } from 'react';

const userEntityKey = 'users1';

export default function App() {
  const dispatch = useDispatch();
  const [is100UserLoad, setIs100UserLoad] = useState(false);

  const { isPending, isFail, users } = useAsyncReducerEffect(
    `users.dataEntity.${userEntityKey}`,
    (_, users: any) => {
      return {
        users: users?.data ?? [],
      };
    },
    (isFail, error) => {
      if (isFail) {
        Alert.alert('Error', error?.message ?? '', [
          {
            text: 'OK',
          },
        ]);
      }
    },
    []
  );

  const { randomUsers } = useAsyncReducerEffect(
    'randomUsers',
    (_, users: any) => {
      return {
        randomUsers: users.data,
      };
    },
    (isFail, error) => {
      if (isFail) {
        Alert.alert('Error', error?.message ?? '', [
          {
            text: 'OK',
          },
        ]);
      }
    },
    []
  );

  const handleLoad = React.useCallback(() => {
    if (!isPending) {
      setIs100UserLoad(false);
      dispatch(
        fetchUsers({
          key: userEntityKey,
          limit: 100,
        })
      );
    }
  }, [isPending, dispatch]);

  const handleLoad100Users = React.useCallback(() => {
    if (!isPending) {
      setIs100UserLoad(true);
      dispatch(
        fetchRandomUsers({
          limit: 100,
        })
      );
    }
  }, [isPending, dispatch]);

  React.useEffect(() => {
    requestAnimationFrame(() => {
      handleLoad();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {isPending ? (
        <View style={styles.indicatorcontainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : isFail ? (
        <View style={styles.indicatorcontainer}>
          <Text>Failed loading users</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleLoad}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={is100UserLoad ? randomUsers : users}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Button title="Load Users" onPress={handleLoad} />
      <Button title="Load 100 Users" onPress={handleLoad100Users} />
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
