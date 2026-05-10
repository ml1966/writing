import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, Dimensions, Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const ANTHROPIC_API_KEY = "在這裡貼上你的API Key"; // ← 替換成你的 API Key

// ── 主題與句型資料 ──────────────────────────────────────────
const TOPIC_POOL = [
  {
    topic: "My Favorite Place",
    hint: "描述一個你喜愛的地方",
    starters: [
      "The place I love most is...",
      "Whenever I visit..., I feel...",
      "What makes this place special is...",
      "I first discovered this place when...",
    ],
  },
  {
    topic: "A Person I Admire",
    hint: "介紹一位你欣賞的人",
    starters: [
      "The person I admire most is...",
      "What I respect about them is...",
      "They taught me that...",
      "One thing they always say is...",
    ],
  },
  {
    topic: "A Recent Challenge",
    hint: "分享一個你最近面對的挑戰",
    starters: [
      "Recently, I faced a challenge when...",
      "At first, I felt..., but then...",
      "The hardest part was...",
      "In the end, I learned that...",
    ],
  },
  {
    topic: "My Daily Routine",
    hint: "描述你的日常生活",
    starters: [
      "Every morning, I usually...",
      "The part of my day I enjoy most is...",
      "I always make time for...",
      "One habit I want to improve is...",
    ],
  },
  {
    topic: "A Dream I Have",
    hint: "分享你的一個夢想或目標",
    starters: [
      "One dream I have always had is...",
      "I imagine that one day I will...",
      "To achieve this, I need to...",
      "This dream matters to me because...",
    ],
  },
];

function pickTopics(n = 4) {
  const shuffled = [...TOPIC_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── Claude API ────────────────────────────────────────────────
async function reviewWriting(topic, text) {
  const prompt = `You are a friendly and encouraging English writing teacher. 
The student chose the topic: "${topic}"
Their writing:
"""
${text}
"""

Please provide:
1. Overall encouragement (1-2 sentences)
2. Grammar corrections (list specific errors and corrections, or say "No major grammar errors!")
3. Vocabulary suggestions (suggest 2-3 better word choices if any)
4. One thing they did well
5. One area to improve next time

Keep your response warm, clear, and motivating. Use simple English.
Format your response with clear sections.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

// ── 畫面：選擇主題 ────────────────────────────────────────────
function TopicScreen({ onSelect }) {
  const [topics] = useState(() => pickTopics(4));

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.heading}>Today's Writing</Text>
      <Text style={styles.subheading}>選擇今日寫作主題</Text>
      {topics.map((t, i) => (
        <TouchableOpacity key={i} style={styles.topicCard} onPress={() => onSelect(t)}>
          <Text style={styles.topicTitle}>{t.topic}</Text>
          <Text style={styles.topicHint}>{t.hint}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── 畫面：寫作 ────────────────────────────────────────────────
function WritingScreen({ topic, onSave, onBack }) {
  const [text, setText] = useState("");
  const [showStarters, setShowStarters] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back 返回</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>{topic.topic}</Text>
      <Text style={styles.subheading}>{topic.hint}</Text>

      {showStarters && (
        <View style={styles.starterBox}>
          <Text style={styles.starterLabel}>💡 建議句型開頭（點擊使用）</Text>
          {topic.starters.map((s, i) => (
            <TouchableOpacity key={i} onPress={() => { setText(s + " "); setShowStarters(false); }}>
              <Text style={styles.starterItem}>{s}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setShowStarters(false)}>
            <Text style={styles.dismissText}>自己開始寫 →</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={[styles.textInput, isTablet && styles.textInputTablet]}
        multiline
        placeholder="Start writing in English here..."
        placeholderTextColor="#999"
        value={text}
        onChangeText={setText}
        textAlignVertical="top"
      />
      <Text style={styles.wordCount}>{text.trim().split(/\s+/).filter(Boolean).length} words</Text>

      <TouchableOpacity
        style={[styles.primaryBtn, !text.trim() && styles.disabledBtn]}
        onPress={() => text.trim() && onSave(text)}
        disabled={!text.trim()}
      >
        <Text style={styles.primaryBtnText}>Save & Get Feedback　儲存並獲得批改</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── 畫面：AI 批改結果 ─────────────────────────────────────────
function FeedbackScreen({ topic, text, feedback, onDone }) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.heading}>Feedback 批改結果</Text>
      <Text style={styles.subheading}>{topic.topic}</Text>

      <View style={styles.originalBox}>
        <Text style={styles.sectionLabel}>📝 Your writing 你的文章</Text>
        <Text style={styles.originalText}>{text}</Text>
      </View>

      <View style={styles.feedbackBox}>
        <Text style={styles.sectionLabel}>🤖 AI Feedback AI 批改</Text>
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onDone}>
        <Text style={styles.primaryBtnText}>Done! Write Again　完成！再寫一篇</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── 畫面：歷史紀錄 ────────────────────────────────────────────
function HistoryScreen({ entries, onClose }) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <TouchableOpacity onPress={onClose} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back 返回</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>History 歷史紀錄</Text>
      {entries.length === 0 && (
        <Text style={styles.emptyText}>還沒有紀錄，完成第一篇後會出現在這裡！</Text>
      )}
      {[...entries].reverse().map((e, i) => (
        <View key={i} style={styles.historyCard}>
          <Text style={styles.historyDate}>{e.date}　{e.topic}</Text>
          <Text style={styles.historyText} numberOfLines={3}>{e.text}</Text>
          <Text style={styles.wordCount}>{e.text.trim().split(/\s+/).filter(Boolean).length} words</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── 主 App ────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("topic"); // topic | writing | loading | feedback | history
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [writingText, setWritingText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem("history").then((val) => {
      if (val) setHistory(JSON.parse(val));
    });
  }, []);

  async function handleSave(text) {
    setWritingText(text);
    setScreen("loading");
    try {
      const result = await reviewWriting(selectedTopic.topic, text);
      setFeedback(result);

      const entry = {
        date: new Date().toLocaleDateString("zh-TW"),
        topic: selectedTopic.topic,
        text,
        feedback: result,
      };
      const updated = [...history, entry];
      setHistory(updated);
      await AsyncStorage.setItem("history", JSON.stringify(updated));
      setScreen("feedback");
    } catch (e) {
      Alert.alert("Error", "無法連接 AI，請確認 API Key 是否正確，並確認網路連線。\n\n" + e.message);
      setScreen("writing");
    }
  }

  if (screen === "history") {
    return (
      <SafeAreaView style={styles.safe}>
        <HistoryScreen entries={history} onClose={() => setScreen("topic")} />
      </SafeAreaView>
    );
  }

  if (screen === "feedback") {
    return (
      <SafeAreaView style={styles.safe}>
        <FeedbackScreen
          topic={selectedTopic}
          text={writingText}
          feedback={feedback}
          onDone={() => { setSelectedTopic(null); setScreen("topic"); }}
        />
      </SafeAreaView>
    );
  }

  if (screen === "loading") {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <Text style={styles.loadingEmoji}>✍️</Text>
        <Text style={styles.loadingText}>AI is reviewing your writing...</Text>
        <Text style={styles.loadingSubText}>AI 正在批改你的文章，請稍候</Text>
      </SafeAreaView>
    );
  }

  if (screen === "writing" && selectedTopic) {
    return (
      <SafeAreaView style={styles.safe}>
        <WritingScreen
          topic={selectedTopic}
          onSave={handleSave}
          onBack={() => setScreen("topic")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.historyBtnRow}>
        <TouchableOpacity onPress={() => setScreen("history")} style={styles.historyBtn}>
          <Text style={styles.historyBtnText}>📖 History ({history.length})</Text>
        </TouchableOpacity>
      </View>
      <TopicScreen onSelect={(t) => { setSelectedTopic(t); setScreen("writing"); }} />
    </SafeAreaView>
  );
}

// ── 樣式 ──────────────────────────────────────────────────────
const C = {
  bg: "#0F1117",
  card: "#1A1D27",
  accent: "#4F8EF7",
  accentLight: "#7DAAFF",
  text: "#E8EAF0",
  muted: "#7A7F94",
  border: "#2A2E3D",
  success: "#3ECF8E",
  warn: "#F7C94F",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  centered: { justifyContent: "center", alignItems: "center" },
  screen: { padding: isTablet ? 40 : 20, paddingBottom: 60 },

  heading: { fontSize: isTablet ? 32 : 24, fontWeight: "800", color: C.text, marginBottom: 4 },
  subheading: { fontSize: isTablet ? 16 : 14, color: C.muted, marginBottom: 24 },

  topicCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 20,
    marginBottom: 14, borderWidth: 1, borderColor: C.border,
  },
  topicTitle: { fontSize: isTablet ? 20 : 17, fontWeight: "700", color: C.accentLight, marginBottom: 4 },
  topicHint: { fontSize: 13, color: C.muted },

  backBtn: { marginBottom: 16 },
  backBtnText: { color: C.accent, fontSize: 15 },

  starterBox: {
    backgroundColor: C.card, borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  starterLabel: { color: C.warn, fontSize: 13, fontWeight: "700", marginBottom: 10 },
  starterItem: { color: C.text, fontSize: 14, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  dismissText: { color: C.accent, fontSize: 13, marginTop: 10, textAlign: "right" },

  textInput: {
    backgroundColor: C.card, color: C.text, borderRadius: 12,
    padding: 16, fontSize: 16, minHeight: 200, borderWidth: 1,
    borderColor: C.border, lineHeight: 26,
  },
  textInputTablet: { minHeight: 320, fontSize: 18 },
  wordCount: { color: C.muted, fontSize: 12, textAlign: "right", marginTop: 6, marginBottom: 16 },

  primaryBtn: {
    backgroundColor: C.accent, borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  disabledBtn: { backgroundColor: C.border },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  originalBox: {
    backgroundColor: C.card, borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
  },
  feedbackBox: {
    backgroundColor: "#0D1F18", borderRadius: 12, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: C.success,
  },
  sectionLabel: { color: C.muted, fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" },
  originalText: { color: C.text, fontSize: 15, lineHeight: 24 },
  feedbackText: { color: C.text, fontSize: 15, lineHeight: 26 },

  historyBtnRow: { paddingHorizontal: 20, paddingTop: 12, alignItems: "flex-end" },
  historyBtn: { backgroundColor: C.card, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  historyBtnText: { color: C.accentLight, fontSize: 13 },

  historyCard: {
    backgroundColor: C.card, borderRadius: 12, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: C.border,
  },
  historyDate: { color: C.accent, fontSize: 13, marginBottom: 6, fontWeight: "600" },
  historyText: { color: C.text, fontSize: 14, lineHeight: 22 },
  emptyText: { color: C.muted, textAlign: "center", marginTop: 60, fontSize: 15 },

  loadingEmoji: { fontSize: 60, marginBottom: 20 },
  loadingText: { color: C.text, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  loadingSubText: { color: C.muted, fontSize: 14 },
});
