import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="google-signin" />
      <Stack.Screen name="apple-signin" />
      <Stack.Screen name="anonymous-signin" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="language" />
    </Stack>
  );
}