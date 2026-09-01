import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { postFeatureInterest } from '../lib/endpoints.js';

const COLORS = { forest: '#0C1A14', emerald: '#059669', gold: '#D4A843', cream: '#F0F4F2' };

export default function ComingSoonModal({ visible, onClose, featureKey, title, description }) {
  const [status, setStatus] = useState('idle');

  const handleInterest = async () => {
    try {
      await postFeatureInterest(featureKey);
    } catch (e) {
      // non-critical, ignore
    } finally {
      setStatus('submitted');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.badge}>Coming Soon</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {status === 'idle' ? (
            <>
              <Text style={styles.question}>Would you use this if we built it?</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleInterest}>
                  <Text style={styles.primaryButtonText}>Yes, I'd use it</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                  <Text style={styles.secondaryButtonText}>Maybe later</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.thankYou}>JazakAllahu khair! We'll let you know when it's ready.</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.primaryButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(12,26,20,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: COLORS.cream, borderRadius: 16, padding: 20 },
  badge: { alignSelf: 'flex-start', backgroundColor: COLORS.gold, color: COLORS.forest, fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 12, overflow: 'hidden' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.forest, marginBottom: 6 },
  description: { fontSize: 14, color: '#4B5A52', marginBottom: 16, lineHeight: 20 },
  question: { fontSize: 14, fontWeight: '600', color: COLORS.forest, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  primaryButton: { flex: 1, backgroundColor: COLORS.emerald, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryButton: { flex: 1, backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#C7D0CB' },
  secondaryButtonText: { color: COLORS.forest, fontWeight: '600', fontSize: 14 },
  closeButton: {
    backgroundColor: COLORS.emerald,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  thankYou: { fontSize: 14, color: COLORS.forest, marginBottom: 16, lineHeight: 20 },
});