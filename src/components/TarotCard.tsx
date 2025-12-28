import React, { useState } from 'react';
import { TouchableOpacity, Image, Text, Animated, StyleSheet } from 'react-native';
import tarotImageMap from '../assets/tarotImageMap';

interface TarotCardProps {
  card: {
    id: number;
    name: string;
    image: string;
  };
  flipped: boolean;
  isSelected: boolean;
  onPress: () => void;
}

export default function TarotCard({ card, flipped, isSelected, onPress }: TarotCardProps) {
  // const handlePress = () => {
  //   if (!flipped) setFlipped(true);
  //   onPress();
  // };

  return (
    <TouchableOpacity onPress={onPress} style={styles.cardContainer}>
      <Image
        source={flipped ? tarotImageMap[card.image] : require('../assets/tarot/back.jpg')}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {isSelected && (
        <Text style={styles.cardText}>{card.name}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 60,
    alignItems: 'center',
    margin: 4,
  },
  cardImage: {
    width: 50,
    height: 90,
    borderRadius: 6,
  },
  cardText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Poppins',
  },
});