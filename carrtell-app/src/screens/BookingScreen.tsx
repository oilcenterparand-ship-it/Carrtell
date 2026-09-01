import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import type { Vehicle } from '../types/models';
import { serviceTypes, timeSlots } from '../services/mockData';
import { useState } from 'react';

type Props = {
  vehicle: Vehicle | null;
  onSelectVehicle: () => void;
};

export default function BookingScreen({ vehicle, onSelectVehicle }: Props) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const progressLabels = ['خودرو', 'سرویس', 'آدرس', 'زمان', 'تأیید'];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View>
        <Text style={styles.title}>رزرو سرویس</Text>
        <Text style={styles.subtitle}>یک مسیر کوتاه تا سرویس در محل</Text>
      </View>

      <View style={styles.progress}>
        {progressLabels.map((label, index) => {
          const active = index + 1 <= step;
          return (
            <View key={label} style={styles.progressItem}>
              <View style={[styles.progressDot, active && styles.progressDotActive]}><Text style={[styles.progressDotText, active && styles.progressDotTextActive]}>{index + 1}</Text></View>
              <Text style={[styles.progressLabel, active && styles.progressLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {step === 1 ? (
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>مرحله ۱</Text>
          <Text style={styles.cardTitle}>خودرو</Text>
          <Pressable style={styles.vehicleOption} onPress={onSelectVehicle}>
            <View style={styles.vehicleIcon}><Text style={styles.vehicleIconText}>C</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleTitle}>{vehicle ? vehicle.title : 'انتخاب خودرو'}</Text>
              <Text style={styles.vehicleText}>{vehicle ? vehicle.subtitle : 'برای ادامه خودرو را انتخاب کن.'}</Text>
            </View>
            <Text style={styles.vehicleChange}>تغییر</Text>
          </Pressable>
          <Pressable style={styles.nextButton} onPress={next}><Text style={styles.nextButtonText}>ادامه</Text></Pressable>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>مرحله ۲</Text>
          <Text style={styles.cardTitle}>نوع سرویس</Text>
          <View style={styles.serviceList}>
            {serviceTypes.map((item) => {
              const selected = service === item.id;
              return (
                <Pressable key={item.id} style={[styles.serviceItem, selected && styles.serviceItemSelected]} onPress={() => setService(item.id)}>
                  <View style={[styles.radio, selected && styles.radioSelected]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceTitle}>{item.title}</Text>
                    <Text style={styles.serviceText}>{item.subtitle}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.actions}><Pressable style={styles.backButton} onPress={back}><Text style={styles.backButtonText}>قبلی</Text></Pressable><Pressable style={[styles.nextButton, { flex: 1 }]} onPress={next}><Text style={styles.nextButtonText}>ادامه</Text></Pressable></View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>مرحله ۳</Text>
          <Text style={styles.cardTitle}>محل سرویس</Text>
          <Pressable style={[styles.locationCard, location && styles.locationCardSelected]} onPress={() => setLocation('current')}>
            <Text style={styles.locationIcon}>⌾</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationTitle}>استفاده از موقعیت فعلی</Text>
              <Text style={styles.locationText}>موقعیت روی نقشه در اتصال واقعی فعال می‌شود.</Text>
            </View>
          </Pressable>
          <View style={styles.actions}><Pressable style={styles.backButton} onPress={back}><Text style={styles.backButtonText}>قبلی</Text></Pressable><Pressable style={[styles.nextButton, { flex: 1 }]} onPress={next}><Text style={styles.nextButtonText}>ادامه</Text></Pressable></View>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>مرحله ۴</Text>
          <Text style={styles.cardTitle}>تاریخ و ساعت</Text>
          <View style={styles.dateRow}>
            {['امروز', 'فردا', 'پس‌فردا'].map((item) => (
              <Pressable key={item} style={[styles.dateChip, date === item && styles.dateChipSelected]} onPress={() => setDate(item)}>
                <Text style={[styles.dateChipText, date === item && styles.dateChipTextSelected]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.slotWrap}>
            {timeSlots.map((slot) => (
              <Pressable key={slot} style={[styles.slot, time === slot && styles.slotSelected]} onPress={() => setTime(slot)}>
                <Text style={[styles.slotText, time === slot && styles.slotTextSelected]}>{slot}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.actions}><Pressable style={styles.backButton} onPress={back}><Text style={styles.backButtonText}>قبلی</Text></Pressable><Pressable style={[styles.nextButton, { flex: 1 }]} onPress={next}><Text style={styles.nextButtonText}>ادامه</Text></Pressable></View>
        </View>
      ) : null}

      {step === 5 ? (
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>مرحله ۵</Text>
          <Text style={styles.cardTitle}>خلاصه رزرو</Text>
          <View style={styles.summary}>
            <View style={styles.summaryRow}><Text style={styles.summaryValue}>{vehicle?.title || 'انتخاب نشده'}</Text><Text style={styles.summaryLabel}>خودرو</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryValue}>{serviceTypes.find((x) => x.id === service)?.title || 'انتخاب نشده'}</Text><Text style={styles.summaryLabel}>سرویس</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryValue}>{location ? 'موقعیت فعلی' : 'انتخاب نشده'}</Text><Text style={styles.summaryLabel}>محل</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryValue}>{date || '—'} • {time || '—'}</Text><Text style={styles.summaryLabel}>زمان</Text></View>
          </View>
          <View style={styles.actions}><Pressable style={styles.backButton} onPress={back}><Text style={styles.backButtonText}>قبلی</Text></Pressable><Pressable style={[styles.confirmButton, { flex: 1 }]}><Text style={styles.confirmButtonText}>تأیید رزرو</Text></Pressable></View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 15, paddingBottom: 28, gap: 15 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'right' },
  subtitle: { marginTop: 3, color: colors.muted, fontSize: 10, textAlign: 'right' },

  progress: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  progressItem: { flex: 1, alignItems: 'center', gap: 5 },
  progressDot: { width: 27, height: 27, borderRadius: 9, backgroundColor: '#132034', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSoft },
  progressDotActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  progressDotText: { color: colors.muted, fontSize: 8.5, fontWeight: '900' },
  progressDotTextActive: { color: colors.bg },
  progressLabel: { color: colors.muted, fontSize: 7.5 },
  progressLabelActive: { color: colors.text, fontWeight: '800' },

  card: { padding: 15, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  cardEyebrow: { color: colors.gold, fontSize: 8.5, fontWeight: '900', textAlign: 'right' },
  cardTitle: { marginTop: 4, marginBottom: 13, color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'right' },

  vehicleOption: { minHeight: 82, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 11, borderRadius: 15, backgroundColor: '#091421', borderWidth: 1, borderColor: colors.borderSoft },
  vehicleIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#2A240E', alignItems: 'center', justifyContent: 'center' },
  vehicleIconText: { color: colors.gold, fontSize: 18, fontWeight: '900' },
  vehicleTitle: { color: colors.text, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  vehicleText: { marginTop: 3, color: colors.muted, fontSize: 9, textAlign: 'right' },
  vehicleChange: { color: colors.gold, fontSize: 9, fontWeight: '900' },

  serviceList: { gap: 8 },
  serviceItem: { minHeight: 72, flexDirection: 'row-reverse', alignItems: 'center', gap: 9, padding: 11, borderRadius: 14, backgroundColor: '#091421', borderWidth: 1, borderColor: colors.borderSoft },
  serviceItemSelected: { borderColor: colors.cyan, backgroundColor: '#0C1E31' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.bg },
  radioSelected: { borderColor: colors.cyan, backgroundColor: colors.cyan },
  serviceTitle: { color: colors.text, fontSize: 12, fontWeight: '900', textAlign: 'right' },
  serviceText: { marginTop: 3, color: colors.muted, fontSize: 8.5, textAlign: 'right' },

  locationCard: { minHeight: 100, flexDirection: 'row-reverse', alignItems: 'center', gap: 11, padding: 13, borderRadius: 16, backgroundColor: '#091421', borderWidth: 1, borderColor: colors.borderSoft },
  locationCardSelected: { borderColor: colors.success, backgroundColor: '#0D201B' },
  locationIcon: { color: colors.success, fontSize: 27 },
  locationTitle: { color: colors.text, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  locationText: { marginTop: 4, color: colors.muted, fontSize: 8.5, lineHeight: 15, textAlign: 'right' },

  dateRow: { flexDirection: 'row-reverse', gap: 8 },
  dateChip: { flex: 1, minHeight: 40, borderRadius: 12, backgroundColor: '#091421', borderWidth: 1, borderColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
  dateChipSelected: { backgroundColor: '#2A240E', borderColor: '#6A5613' },
  dateChipText: { color: colors.mutedStrong, fontSize: 9.5, fontWeight: '800' },
  dateChipTextSelected: { color: colors.goldSoft },

  slotWrap: { marginTop: 10, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  slot: { width: '30%', minHeight: 40, borderRadius: 11, backgroundColor: '#091421', borderWidth: 1, borderColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
  slotSelected: { backgroundColor: '#102A44', borderColor: colors.cyan },
  slotText: { color: colors.mutedStrong, fontSize: 9.5, fontWeight: '800' },
  slotTextSelected: { color: colors.cyan },

  summary: { gap: 10, padding: 12, borderRadius: 14, backgroundColor: '#091421' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  summaryLabel: { color: colors.muted, fontSize: 9.5 },
  summaryValue: { color: colors.text, fontSize: 9.5, fontWeight: '850' },

  actions: { marginTop: 14, flexDirection: 'row-reverse', gap: 8 },
  nextButton: { minHeight: 45, marginTop: 14, borderRadius: 13, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  nextButtonText: { color: colors.bg, fontSize: 10.5, fontWeight: '900' },
  backButton: { minWidth: 86, minHeight: 45, borderRadius: 13, backgroundColor: '#132239', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: colors.mutedStrong, fontSize: 10, fontWeight: '850' },
  confirmButton: { minHeight: 45, borderRadius: 13, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { color: colors.bg, fontSize: 10.5, fontWeight: '900' },
});
