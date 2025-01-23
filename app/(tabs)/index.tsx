import { ImageBackground, StyleSheet, Button, View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <ImageBackground
      source={require('@/assets/images/Slider.png')}
      style={styles.backgroundImage}
    >
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('VoiceChatbot')}
        >
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50
  },
  btn: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DD3D01',
    justifyContent: 'center', // Center the text vertically
    alignItems: 'center', // Center the text horizontally
  },
  buttonText: {
    color: '#DD3D01',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
