import React from 'react';
import { View } from 'react-native';
import { OrderMessageBubble } from './OrderMessageBubble';

export type OrderLogItem = {
  id: string;
  text: string;
  avatar: 'assistant' | 'delivery';
};

export const OrderMessageLog: React.FC<{ messages: OrderLogItem[] }> = ({ messages }) => {
  if (!messages || messages.length === 0) return null;
  return (
    <View style={{ marginBottom: 12 }}>
      {messages.map((m) => (
        <OrderMessageBubble key={m.id} text={m.text} avatar={m.avatar} />
      ))}
    </View>
  );
};

