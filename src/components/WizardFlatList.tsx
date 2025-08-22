import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CompletedItem = {
  index: number;
  title: string;
  summary: string;
};

type NodeCompleted = { key: string; kind: 'completed'; item: CompletedItem };
type NodeQuestion = { key: string; kind: 'question' };
type Node = NodeCompleted | NodeQuestion;

const ROW_H = 72;

const PUSH_ANIM = {
  duration: 260,
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
} as const;

export interface WizardFlatListProps {
  questions: { title: string }[];
  completed: CompletedItem[]; // sorted from oldest to newest or any; component handles order
  currentCard: React.ReactNode; // rendered question card for current step
  onEdit?: (index: number) => void; // tap a completed row to edit that step
}

export default function WizardFlatList({ questions, completed, currentCard, onEdit }: WizardFlatListProps) {
  const { theme } = useTheme();
  const listRef = useRef<FlatList<Node>>(null);
  const [lastY, setLastY] = useState(0);
  const { width, height } = useWindowDimensions();
  const isMobile = width <= 768;
  const cardHeight = Math.floor(height * 0.875); // 当前问题占可视高度的 7/8

  const nodes: Node[] = useMemo(() => {
    const completedNodes: Node[] = completed
      .slice() // copy
      .reverse() // latest first (top of inverted list)
      .map((it, i) => ({ key: `c-${it.index}-${i}`, kind: 'completed', item: it }));
    const q: NodeQuestion = { key: 'q-current', kind: 'question' };
    return [q, ...completedNodes];
  }, [completed]);

  const completedCount = completed.length;

  useEffect(() => {
    LayoutAnimation.configureNext(PUSH_ANIM);
  }, [completedCount]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setLastY(e.nativeEvent.contentOffset.y);
  };

  const showCurrent = () => listRef.current?.scrollToIndex({ index: 0, animated: true });
  const showCompleted = () => {
    const topIdx = Math.min(nodes.length - 1, Math.max(0, completedCount - 1));
    if (completedCount > 0) listRef.current?.scrollToIndex({ index: topIdx, animated: true });
  };

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const goingUp = y - lastY > 12; // small upward flick → view completed
    if (goingUp) showCompleted();
    else showCurrent();
  };

  const renderAnswerContent = (summary: string) => {
    if (!summary) return null;
    return (
      <Text numberOfLines={2} style={[styles.rowA, { color: theme.TEXT_SECONDARY }]}>
        {summary}
      </Text>
    );
  };

  const renderItem = ({ item }: { item: Node }) => {
    if (item.kind === 'question') {
      return <View style={[styles.cardContainer, { height: cardHeight }]}>{currentCard}</View>;
    }
    const it = item.item;
    const leftPad = (isMobile ? 20 : 70) + 18; // 左侧边距再增加 18
    return (
      <Pressable
        onPress={() => onEdit?.(it.index)}
        style={({ pressed }) => [
          styles.rowCard,
          {
            paddingLeft: leftPad,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.rowContent}
        >
          <Text numberOfLines={2} style={[styles.rowQ, { color: theme.TEXT_PRIMARY }]}>{it.title}</Text>
          <View style={styles.answerBelow}>{renderAnswerContent(it.summary || '已完成')}</View>
        </View>
      </Pressable>
    );
  };

  const getItemLayout = (_: any, index: number) => {
    if (index === 0) return { length: cardHeight, offset: 0, index };
    return { length: ROW_H, offset: 0, index };
  };

  return (
    <FlatList
      ref={listRef}
      inverted
      data={nodes}
      keyExtractor={(n) => n.key}
      renderItem={renderItem}
      onScroll={onScroll}
      onScrollEndDrag={onScrollEndDrag}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 12, paddingHorizontal: 16 }}
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
  },
  rowCard: {
    minHeight: ROW_H,
    width: '100%',
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 8,
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  rowContent: { flex: 1, justifyContent: 'center' },
  rowQ: { fontSize: 16, fontWeight: '500', flexShrink: 1 },
  rowA: { fontSize: 15, fontWeight: '400' },
  answerBelow: { marginTop: 4 },
});
