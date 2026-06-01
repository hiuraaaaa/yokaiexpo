import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Updates from 'expo-updates';

export default function OTADebug() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus]     = useState('idle');

  const check = async () => {
    setChecking(true);
    setStatus('checking...');
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setStatus('update found! fetching...');
        await Updates.fetchUpdateAsync();
        setStatus('done! reloading...');
        await Updates.reloadAsync();
      } else {
        setStatus('no update available');
      }
    } catch (e: any) {
      setStatus(`error: ${e.message}`);
    }
    setChecking(false);
  };

  return (
    <View style={{
      position: 'absolute', bottom: 100, left: 12, right: 12, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 10, padding: 12,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    }}>
      <Text style={{ color: '#F6CF80', fontWeight: '900', fontSize: 10, marginBottom: 6 }}>
        OTA DEBUG
      </Text>
      <Text style={{ color: '#fff', fontSize: 9, marginBottom: 2 }}>
        channel: {Updates.channel ?? 'null'}
      </Text>
      <Text style={{ color: '#fff', fontSize: 9, marginBottom: 2 }}>
        runtime: {Updates.runtimeVersion ?? 'null'}
      </Text>
      <Text style={{ color: '#fff', fontSize: 9, marginBottom: 2 }}>
        updateId: {Updates.updateId ?? 'embedded'}
      </Text>
      <Text style={{ color: '#fff', fontSize: 9, marginBottom: 8 }}>
        status: {status}
      </Text>
      <TouchableOpacity
        onPress={check}
        disabled={checking}
        style={{ backgroundColor: '#F6CF80', borderRadius: 6, paddingVertical: 6, alignItems: 'center' }}
      >
        <Text style={{ color: '#000', fontWeight: '900', fontSize: 10 }}>
          {checking ? 'checking...' : 'CHECK UPDATE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
