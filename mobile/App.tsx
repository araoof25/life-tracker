import { useState } from "react";
import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import type { DailyReport, HabitAnswers, Rating } from "./src/domain/report";
import { currentRubricVersion, domainIds, getRubric } from "./src/domain/rubric";
import { scoreReport } from "./src/domain/scoring";

const rubric = getRubric(currentRubricVersion);
const domainLabels = {
  health: "Health",
  personalDevelopment: "Personal Development",
  financialDiscipline: "Financial Discipline",
  family: "Family",
};

const dayTypes = [
  { id: "workday", label: "Workday" },
  { id: "dayOff", label: "Day off" },
  { id: "partialWorkday", label: "Partial workday" },
] as const;
const shifts = [
  { id: "morning", label: "Morning" },
  { id: "night", label: "Night" },
  { id: "notApplicable", label: "Not applicable" },
] as const;
const ratings = [
  { id: "mood", label: "Mood" },
  { id: "energy", label: "Energy" },
  { id: "stress", label: "Stress (10 is highest)" },
  { id: "motivation", label: "Motivation" },
  { id: "focus", label: "Focus" },
] as const;
const familyEvents = [
  { id: "child1", label: "Shouting at or hitting child 1" },
  { id: "child2", label: "Shouting at or hitting child 2" },
  { id: "partner", label: "Negative event or deterioration in relationship with partner" },
] as const;
const yesNo = [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }] as const;
const ratingOptions = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1),
  label: String(index + 1),
}));

function cairoDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  return ["year", "month", "day"].map((part) => parts.find(({ type }) => type === part)?.value).join("-");
}

function usePalette() {
  return useColorScheme() === "dark"
    ? { background: "#111B17", card: "#192721", text: "#F0F7F2", muted: "#B7C9BF", line: "#445D51", accent: "#9DE2BB", onAccent: "#102619" }
    : { background: "#F2F6F3", card: "#FFFFFF", text: "#14261E", muted: "#486056", line: "#AABDB1", accent: "#225D43", onAccent: "#FFFFFF" };
}

function Choices<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: readonly { id: T; label: string }[];
  value?: T;
  onChange: (value: T | undefined) => void;
}) {
  const colors = usePalette();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={label + ", " + option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? undefined : option.id)}
              style={[
                styles.option,
                { borderColor: selected ? colors.accent : colors.line,
                  backgroundColor: selected ? colors.accent : colors.card },
              ]}
            >
              <Text style={{ color: selected ? colors.onAccent : colors.text }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Field({ label, value, onChange, multiline = false, decimal = false }: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  multiline?: boolean;
  decimal?: boolean;
}) {
  const colors = usePalette();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={decimal ? "decimal-pad" : "default"}
        style={[styles.input, { color: colors.text, borderColor: colors.line }, multiline && styles.multiline]}
      />
    </View>
  );
}

function Section({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const colors = usePalette();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={styles.sectionButton}
      >
        <View style={styles.sectionText}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {detail && <Text style={{ color: colors.muted }}>{detail}</Text>}
        </View>
        <Text style={[styles.toggle, { color: colors.accent }]}>{expanded ? "−" : "+"}</Text>
      </Pressable>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

function percentage(value: number) {
  return new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

export default function App() {
  const dark = useColorScheme() === "dark";
  const colors = usePalette();
  const [date, setDate] = useState(cairoDate);
  const [dayType, setDayType] = useState<DailyReport["dayType"]>();
  const [shift, setShift] = useState<DailyReport["shift"]>();
  const [hours, setHours] = useState("");
  const [habitAnswers, setHabitAnswers] = useState<HabitAnswers>({});
  const [complaints, setComplaints] = useState("");
  const [wellbeing, setWellbeing] = useState<NonNullable<DailyReport["wellbeing"]>>({});
  const [eventAnswers, setEventAnswers] = useState<Partial<Record<(typeof familyEvents)[number]["id"], "yes" | "no">>>({});
  const [eventNotes, setEventNotes] = useState<Partial<Record<(typeof familyEvents)[number]["id"], string>>>({});
  const [notes, setNotes] = useState("");
  const { overall, domains, completeness } = scoreReport({
    rubricVersion: currentRubricVersion,
    habitAnswers,
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={dark ? "light" : "dark"} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <Text style={[styles.brand, { color: colors.accent }]}>Life Tracker</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Daily check-in</Text>
        <Text style={[styles.preview, { color: colors.muted }]}>Preview with sample answers. Entries clear when the app reloads.</Text>

        <View style={[styles.card, styles.summary, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.muted }}>Overall adherence</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.score, { color: colors.text }]}>
            {overall.score === null ? "Unavailable" : percentage(overall.score)}
          </Text>
          {overall.status === "provisional" && <Text style={{ color: colors.muted }}>Provisional</Text>}
          <Text style={{ color: colors.muted }}>
            {completeness.answered} of {completeness.total} answered · {completeness.unanswered} unanswered
          </Text>
        </View>

        <Section title="Day details">
          <Field label="Date (YYYY-MM-DD)" value={date} onChange={setDate} />
          <Choices label="Day type" options={dayTypes} value={dayType} onChange={setDayType} />
          <Choices label="Shift" options={shifts} value={shift} onChange={setShift} />
          <Field label="Hours worked (optional)" value={hours} onChange={setHours} decimal />
        </Section>

        {domainIds.map((domain) => {
          const result = domains[domain];
          const score = result.score === null ? "Unavailable" : percentage(result.score);
          return (
            <Section key={domain} title={domainLabels[domain]} detail={score + " · " + result.answered + " answered"}>
              {rubric[domain].map((habit) => (
                <Choices
                  key={habit.id}
                  label={habit.label}
                  options={habit.options}
                  value={habitAnswers[habit.id]}
                  onChange={(value) => setHabitAnswers((previous) => ({ ...previous, [habit.id]: value }))}
                />
              ))}
              {domain === "health" && <Field label="Health complaints (optional)" value={complaints} onChange={setComplaints} multiline />}
              {domain === "family" && familyEvents.map(({ id, label }) => (
                <View key={id}>
                  <Choices label={label} options={yesNo} value={eventAnswers[id]} onChange={(value) => {
                    setEventAnswers((previous) => ({ ...previous, [id]: value }));
                  }} />
                  {eventAnswers[id] === "yes" && <Field
                    label="Private note (optional)"
                    value={eventNotes[id] ?? ""}
                    onChange={(value) => setEventNotes((previous) => ({ ...previous, [id]: value }))}
                    multiline
                  />}
                </View>
              ))}
            </Section>
          );
        })}

        <Section title="Psychological well-being">
          {ratings.map(({ id, label }) => (
            <Choices
              key={id}
              label={label}
              options={ratingOptions}
              value={wellbeing[id]?.toString()}
              onChange={(value) => setWellbeing((previous) => ({
                ...previous, [id]: value === undefined ? undefined : Number(value) as Rating,
              }))}
            />
          ))}
          <Field label="Daily notes (optional)" value={notes} onChange={setNotes} multiline />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  page: { padding: 20, paddingBottom: 36, gap: 10, width: "100%", maxWidth: 640, alignSelf: "center" },
  brand: { fontSize: 15, fontWeight: "700", marginTop: 12 },
  title: { fontSize: 34, fontWeight: "700" },
  preview: { marginBottom: 8, lineHeight: 20 },
  card: { borderRadius: 16 },
  summary: { padding: 18, gap: 5, marginBottom: 4 },
  score: { fontSize: 30, fontWeight: "700" },
  sectionButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, minHeight: 56, gap: 10 },
  sectionText: { flex: 1, gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionContent: { paddingHorizontal: 16, paddingBottom: 8 },
  toggle: { fontSize: 24 },
  field: { marginBottom: 18, gap: 8 },
  label: { fontSize: 15, fontWeight: "600" },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { minHeight: 44, minWidth: 44, maxWidth: "100%", borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  input: { borderWidth: 1, borderRadius: 10, minHeight: 44, padding: 10, fontSize: 16 },
  multiline: { minHeight: 76, textAlignVertical: "top" },
});
