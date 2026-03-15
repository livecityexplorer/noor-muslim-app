import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const MODULES = [
  {
    id: "basics",
    title: "Halal Basics",
    icon: "📖",
    color: "#166534",
    description: "Understand the fundamental principles of Halal and Haram in Islam.",
    lessons: [
      {
        title: "What is Halal?",
        content: `The word "Halal" (حلال) means "permissible" or "lawful" in Arabic. In the context of food, it refers to anything that is allowed under Islamic law (Sharia).\n\nAllah says in the Quran: "O mankind, eat from whatever is on earth [that is] lawful and good and do not follow the footsteps of Satan. Indeed, he is to you a clear enemy." (Quran 2:168)\n\nHalal food must meet several conditions:\n• It must not contain any Haram (forbidden) ingredients\n• If it contains meat, the animal must be slaughtered according to Islamic law (Dhabihah)\n• It must not be contaminated with Haram substances during preparation, processing, or storage\n• The person performing the slaughter must be a Muslim, Christian, or Jew`,
      },
      {
        title: "What is Haram?",
        content: `"Haram" (حرام) means "forbidden" or "unlawful." The Quran explicitly prohibits certain foods:\n\n"He has only forbidden to you dead animals, blood, the flesh of swine, and that which has been dedicated to other than Allah." (Quran 2:173)\n\nThe main categories of Haram food:\n• Pork and all its by-products (lard, gelatin from pork, etc.)\n• Blood and blood products\n• Animals that died without proper slaughter (carrion)\n• Animals slaughtered in the name of other than Allah\n• Alcohol and intoxicants\n• Carnivorous animals, birds of prey, and certain other animals`,
      },
      {
        title: "What is Mushbooh?",
        content: `"Mushbooh" (مشبوه) means "doubtful" or "suspect." These are ingredients or products whose Halal status is unclear because:\n\n• The source of the ingredient is unknown (e.g., gelatin without source specification)\n• The ingredient can be derived from both Halal and Haram sources\n• The processing method is unclear\n• Scholars have differing opinions on its permissibility\n\nThe Prophet ﷺ said: "The halal is clear and the haram is clear, and between them are doubtful matters about which many people do not know. Whoever avoids doubtful matters clears himself in regard to his religion and his honor." (Bukhari & Muslim)\n\nFor Mushbooh items, the safest approach is to avoid them unless you can verify their source.`,
      },
    ],
  },
  {
    id: "additives",
    title: "E-Numbers & Additives",
    icon: "🧪",
    color: "#1E3A8A",
    description: "Decode E-numbers and understand which food additives are Halal.",
    lessons: [
      {
        title: "Understanding E-Numbers",
        content: `E-numbers are codes for food additives approved for use in the European Union. They appear on ingredient labels as "E" followed by a number.\n\nNot all E-numbers are Haram — many are derived from plants or are synthetic. However, some are derived from animals and may be Haram.\n\nKey categories:\n• E100-E199: Colors\n• E200-E299: Preservatives\n• E300-E399: Antioxidants\n• E400-E499: Thickeners, stabilizers, emulsifiers\n• E500-E599: Acidity regulators\n• E600-E699: Flavor enhancers\n• E900-E999: Waxes, glazing agents, sweeteners`,
      },
      {
        title: "Common Haram E-Numbers",
        content: `These E-numbers are commonly derived from Haram sources:\n\n• E120 (Carmine/Cochineal): Made from crushed female cochineal insects. Used in red/pink food coloring. Found in candies, yogurt, juices.\n\n• E441 (Gelatin): May be pork-derived. Used as a gelling agent. Found in gummies, marshmallows, capsules.\n\n• E471 (Mono- and diglycerides): May be animal-derived. Used as emulsifiers. Found in bread, margarine, ice cream.\n\n• E542 (Bone phosphate): Derived from animal bones. Used as anti-caking agent.\n\n• E904 (Shellac): Secreted by lac insects. Used as a glazing agent on fruits and candies.`,
      },
      {
        title: "Commonly Halal E-Numbers",
        content: `These E-numbers are generally considered Halal:\n\n• E100 (Curcumin): From turmeric — always Halal\n• E160a (Beta-carotene): From plants or synthetic — Halal\n• E200-E203 (Sorbic acid and sorbates): Synthetic — Halal\n• E260 (Acetic acid/Vinegar): Plant-derived — Halal\n• E300 (Ascorbic acid/Vitamin C): Synthetic — Halal\n• E406 (Agar): From seaweed — Halal\n• E440 (Pectin): From fruit peels — Halal\n• E500 (Sodium bicarbonate): Synthetic — Halal\n• E621 (MSG): Synthetic or plant-derived — Halal\n\nNote: Always verify as manufacturing processes can change.`,
      },
    ],
  },
  {
    id: "meat",
    title: "Halal Meat & Slaughter",
    icon: "🥩",
    color: "#7C2D12",
    description: "Learn about Islamic slaughter (Dhabihah) and how to identify Halal meat.",
    lessons: [
      {
        title: "Dhabihah: Islamic Slaughter",
        content: `Dhabihah (ذبيحة) is the prescribed method of slaughter for meat to be Halal:\n\n1. The slaughterer must be a Muslim (or a People of the Book — Christian or Jew, according to most scholars)\n2. The name of Allah must be invoked: "Bismillah, Allahu Akbar"\n3. The slaughter must be performed with a sharp blade\n4. The cut must sever the trachea, esophagus, and both jugular veins\n5. The animal must be alive and healthy at the time of slaughter\n6. The blood must be allowed to drain completely\n7. The animal must not see the blade or witness other animals being slaughtered`,
      },
      {
        title: "Stunning Controversy",
        content: `Many Western slaughterhouses use pre-slaughter stunning (electric, gas, or bolt). Scholars differ on whether stunned animals are Halal:\n\n• Majority view: Reversible stunning (where the animal would recover if not slaughtered) is permissible if the animal is still alive at slaughter.\n• Stricter view: Any stunning is not permissible as it may cause death before slaughter.\n• IFANCA, HFA, and many certifying bodies accept certain forms of stunning.\n• JAKIM (Malaysia) and some scholars require no stunning.\n\nWhen in doubt, choose products with recognized Halal certification from a body you trust.`,
      },
      {
        title: "Hidden Animal Ingredients",
        content: `Many processed foods contain hidden animal-derived ingredients:\n\n• Gelatin: In gummies, marshmallows, yogurt, capsules\n• Lard: In some pastries, biscuits, and fried foods\n• Rennet: In cheese (animal rennet from calf stomach)\n• L-Cysteine (E920): In bread, may be from hog hair or human hair\n• Carmine (E120): Red dye from insects in candies and juices\n• Mono- and diglycerides (E471): Emulsifiers possibly from pork fat\n• Whey: From dairy, generally Halal but check rennet used in cheese production`,
      },
    ],
  },
  {
    id: "alcohol",
    title: "Alcohol in Food",
    icon: "🍷",
    color: "#4A1D96",
    description: "Understand when alcohol in food is Haram and when scholars differ.",
    lessons: [
      {
        title: "Why Alcohol is Haram",
        content: `Allah says in the Quran: "O you who have believed, indeed, intoxicants, gambling, [sacrificing on] stone altars [to other than Allah], and divining arrows are but defilement from the work of Satan, so avoid it that you may be successful." (Quran 5:90)\n\nThe Prophet ﷺ said: "Every intoxicant is Khamr (wine), and every Khamr is Haram." (Muslim)\n\nThe prohibition extends to:\n• All alcoholic beverages\n• Foods cooked with alcohol (if alcohol remains)\n• Products containing alcohol as an ingredient\n• Vanilla extract (contains ethanol)\n• Some flavorings and essences`,
      },
      {
        title: "Trace Alcohol in Food",
        content: `Scholars differ on trace amounts of alcohol in food:\n\n• Strict view: Any amount of alcohol from Khamr (wine/beer) is Haram, regardless of quantity.\n• Lenient view: Alcohol produced as a by-product of fermentation (like in bread or vinegar) is permissible as it transforms into a different substance (istihalah).\n• Middle view: Alcohol used as a solvent for flavors (not from grapes/dates) in very small quantities may be permissible according to some scholars.\n\nPractical guidance:\n• Avoid products listing "alcohol" or "wine" as ingredients\n• Vanilla extract: Use vanilla powder or halal-certified extract\n• Vinegar: Permissible as the alcohol has transformed\n• Fermented foods (bread, soy sauce): Generally permissible`,
      },
    ],
  },
  {
    id: "certification",
    title: "Halal Certification",
    icon: "✅",
    color: "#065F46",
    description: "How to identify and trust Halal certification logos.",
    lessons: [
      {
        title: "Major Halal Certifying Bodies",
        content: `Trusted Halal certification organizations worldwide:\n\n🇺🇸 USA:\n• IFANCA (Islamic Food and Nutrition Council of America)\n• HFA (Halal Food Authority)\n• ISWA (Islamic Society of Washington Area)\n\n🇬🇧 UK:\n• HFA (Halal Food Authority)\n• HMC (Halal Monitoring Committee) — stricter, no stunning\n\n🇲🇾 Malaysia:\n• JAKIM — government body, widely trusted\n\n🇮🇩 Indonesia:\n• MUI (Majelis Ulama Indonesia)\n\n🇸🇬 Singapore:\n• MUIS (Islamic Religious Council of Singapore)\n\n🇦🇺 Australia:\n• AFIC (Australian Federation of Islamic Councils)`,
      },
      {
        title: "How to Verify Certification",
        content: `Steps to verify a Halal certification is legitimate:\n\n1. Look for the certification logo on the packaging\n2. Note the certification number (usually printed near the logo)\n3. Visit the certifying body's official website\n4. Search their database for the product or manufacturer\n5. Check the expiry date of the certification\n\nRed flags:\n• No certification number\n• Certification body not recognized\n• Logo looks unofficial or poorly printed\n• Manufacturer cannot provide certificate when asked\n\nWhen in doubt, contact the manufacturer directly and ask for their Halal certificate.`,
      },
    ],
  },
];

function LessonCard({
  lesson,
  isOpen,
  onToggle,
}: {
  lesson: { title: string; content: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.lessonCard}>
      <Pressable
        style={({ pressed }) => [styles.lessonHeader, pressed && { opacity: 0.8 }]}
        onPress={onToggle}
      >
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <IconSymbol name={isOpen ? "chevron.up" : "chevron.down"} size={16} color="#4ADE80" />
      </Pressable>
      {isOpen && (
        <View style={styles.lessonContent}>
          <Text style={styles.lessonText}>{lesson.content}</Text>
        </View>
      )}
    </View>
  );
}

export default function LearnScreen() {
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [openLesson, setOpenLesson] = useState<string | null>(null);

  const activeModule = MODULES.find((m) => m.id === selectedModule);

  return (
    <ScreenContainer containerClassName="bg-[#0A0A1A]" safeAreaClassName="bg-[#0A0A1A]">
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => {
            if (selectedModule) {
              setSelectedModule(null);
              setOpenLesson(null);
            } else {
              router.back();
            }
          }}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{activeModule ? activeModule.title : "Learn Halal"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedModule ? (
          <>
            {/* Intro */}
            <View style={styles.intro}>
              <Text style={styles.introTitle}>Islamic Food Knowledge</Text>
              <Text style={styles.introText}>
                Deepen your understanding of Halal principles, E-numbers, slaughter methods, and how to make informed food choices as a Muslim.
              </Text>
            </View>

            {/* Modules */}
            {MODULES.map((module) => (
              <Pressable
                key={module.id}
                style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                onPress={() => setSelectedModule(module.id)}
              >
                <LinearGradient
                  colors={[module.color, `${module.color}88`]}
                  style={styles.moduleCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.moduleIcon}>{module.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleDesc}>{module.description}</Text>
                    <Text style={styles.moduleLessons}>{module.lessons.length} lessons</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </Pressable>
            ))}

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                📚 This educational content is based on mainstream Islamic scholarship. For personal rulings, consult a qualified Islamic scholar.
              </Text>
            </View>
          </>
        ) : (
          activeModule && (
            <>
              <View style={styles.moduleIntro}>
                <Text style={styles.moduleIntroIcon}>{activeModule.icon}</Text>
                <Text style={styles.moduleIntroDesc}>{activeModule.description}</Text>
              </View>

              <View style={styles.lessons}>
                {activeModule.lessons.map((lesson, i) => (
                  <LessonCard
                    key={i}
                    lesson={lesson}
                    isOpen={openLesson === `${activeModule.id}-${i}`}
                    onToggle={() =>
                      setOpenLesson(
                        openLesson === `${activeModule.id}-${i}` ? null : `${activeModule.id}-${i}`
                      )
                    }
                  />
                ))}
              </View>
            </>
          )
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  intro: { marginBottom: 20 },
  introTitle: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", marginBottom: 8 },
  introText: { fontSize: 14, color: "#94A3B8", lineHeight: 22 },
  moduleCard: { borderRadius: 16, padding: 18, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 14 },
  moduleIcon: { fontSize: 32 },
  moduleTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  moduleDesc: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4, lineHeight: 18 },
  moduleLessons: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 6 },
  disclaimer: { backgroundColor: "#1C1917", borderRadius: 10, padding: 14, marginTop: 8 },
  disclaimerText: { fontSize: 12, color: "#78716C", lineHeight: 18, textAlign: "center" },
  moduleIntro: { backgroundColor: "#111827", borderRadius: 14, padding: 16, marginBottom: 16, alignItems: "center" },
  moduleIntroIcon: { fontSize: 40, marginBottom: 10 },
  moduleIntroDesc: { fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 22 },
  lessons: { gap: 8 },
  lessonCard: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden" },
  lessonHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  lessonTitle: { fontSize: 15, fontWeight: "700", color: "#FFFFFF", flex: 1, marginRight: 8 },
  lessonContent: { paddingHorizontal: 16, paddingBottom: 16 },
  lessonText: { fontSize: 13, color: "#94A3B8", lineHeight: 22 },
});
