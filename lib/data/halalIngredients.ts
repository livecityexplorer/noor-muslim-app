export type HalalStatus = "halal" | "haram" | "mushbooh" | "unknown";

export interface IngredientAlternative {
  name: string;
  source: string;
  status: HalalStatus;
}

export interface ScholarlyOpinion {
  school: string;
  opinion: string;
}

export interface QuranReference {
  surah: string;
  ayah: string;
  arabic: string;
  translation: string;
}

export interface HadithReference {
  text: string;
  source: string;
}

export interface Ingredient {
  id: string;
  name: string;
  eNumbers: string[];
  otherNames: string[];
  status: HalalStatus;
  category: IngredientCategory;
  source: string;
  shortDescription: string;
  whatIsIt: string;
  sourceDetails: string;
  islamicRuling: string;
  whyItMatters: string;
  howToIdentify: string;
  alternatives: IngredientAlternative[];
  commonProducts: string[];
  scholarlyOpinions: ScholarlyOpinion[];
  quranReferences: QuranReference[];
  hadithReferences: HadithReference[];
}

export type IngredientCategory =
  | "animal-derived"
  | "alcohol-based"
  | "additives"
  | "e-numbers"
  | "hidden"
  | "plant-based"
  | "halal-certified";

export const INGREDIENT_DATABASE: Ingredient[] = [
  {
    id: "gelatin",
    name: "Gelatin",
    eNumbers: ["E441"],
    otherNames: ["Hydrolyzed collagen", "Collagen peptides", "Hydrolyzed animal protein", "Kosher gelatin"],
    status: "mushbooh",
    category: "animal-derived",
    source: "Animal bones, skin, and connective tissue (pork, beef, or fish)",
    shortDescription: "A protein derived from animal collagen. Halal only if from Halal-slaughtered animals or fish.",
    whatIsIt: "Gelatin is a colorless, flavorless protein obtained by partial hydrolysis of collagen from animal skin, bones, and connective tissues. It is widely used as a gelling agent, stabilizer, and thickener in food, pharmaceuticals, and cosmetics.",
    sourceDetails: "In Western countries, gelatin is predominantly derived from pork skin and bones. In Muslim-majority countries, bovine (beef) gelatin is more common. Fish gelatin is also available and is generally accepted as Halal. Synthetic alternatives like agar-agar and pectin are plant-based and always Halal.",
    islamicRuling: "Gelatin is Mushbooh (doubtful) by default. If derived from pork, it is Haram. If from Halal-slaughtered beef or fish, it is Halal. The majority of Islamic scholars hold that the transformation (istihala) of pork gelatin does not render it Halal.",
    whyItMatters: "Gelatin is one of the most widely used food additives and appears in hundreds of products including gummy candies, marshmallows, yogurt, and vitamin capsules. Without source specification, it is impossible to determine its Halal status.",
    howToIdentify: "Look for 'gelatin', 'E441', 'hydrolyzed collagen', or 'collagen peptides' on ingredient labels. 'Kosher gelatin' does NOT mean Halal — it may still be pork-derived.",
    alternatives: [
      { name: "Agar-agar", source: "Seaweed", status: "halal" },
      { name: "Pectin", source: "Fruit peels", status: "halal" },
      { name: "Carrageenan", source: "Red seaweed", status: "halal" },
      { name: "Guar gum", source: "Guar beans", status: "halal" },
      { name: "Xanthan gum", source: "Bacterial fermentation", status: "halal" },
    ],
    commonProducts: ["Gummy candies", "Marshmallows", "Yogurt", "Cream cheese", "Jell-O", "Vitamin capsules", "Medication coatings", "Ice cream"],
    scholarlyOpinions: [
      { school: "Hanafi", opinion: "Transformation (istihala) does not make pork gelatin Halal; source matters." },
      { school: "Maliki", opinion: "Pork is inherently impure (najis al-ayn); transformation does not purify it." },
      { school: "Shafi'i", opinion: "Source determines status; pork gelatin remains Haram regardless of processing." },
      { school: "Hanbali", opinion: "If completely transformed chemically, some scholars permit it (minority view)." },
    ],
    quranReferences: [
      { surah: "Al-Baqarah", ayah: "2:173", arabic: "إِنَّمَا حَرَّمَ عَلَيْكُمُ الْمَيْتَةَ وَالدَّمَ وَلَحْمَ الْخِنزِيرِ", translation: "He has only forbidden to you dead animals, blood, the flesh of swine..." },
    ],
    hadithReferences: [
      { text: "The halal is clear and the haram is clear, and between them are doubtful matters.", source: "Sahih Bukhari & Muslim" },
    ],
  },
  {
    id: "carmine",
    name: "Carmine",
    eNumbers: ["E120", "E-120"],
    otherNames: ["Cochineal", "Carminic acid", "Natural Red 4", "CI 75470", "Crimson Lake"],
    status: "haram",
    category: "animal-derived",
    source: "Crushed female cochineal insects (Dactylopius coccus)",
    shortDescription: "A red dye made from crushed insects. Haram as it is derived from insects.",
    whatIsIt: "Carmine (E120) is a bright red dye extracted from the dried bodies of female cochineal insects. It takes approximately 70,000 insects to produce one pound of carmine dye. It is used extensively in food, cosmetics, and textiles.",
    sourceDetails: "Carmine is produced by crushing dried cochineal insects and extracting the carminic acid. The insects are native to South America and are farmed primarily in Peru and the Canary Islands.",
    islamicRuling: "Carmine is Haram. The majority of Islamic scholars prohibit the consumption of insects and insect-derived products. Insects (except locusts) are considered impure (najis) in Islamic jurisprudence.",
    whyItMatters: "Carmine is hidden in many products under names like 'natural color' or 'natural red 4'. It appears in yogurt, juices, candies, cosmetics, and even some medications.",
    howToIdentify: "Look for E120, carmine, cochineal, carminic acid, natural red 4, or crimson lake. 'Natural color' on a label may indicate carmine.",
    alternatives: [
      { name: "Beet juice (E162)", source: "Beetroot", status: "halal" },
      { name: "Lycopene (E160d)", source: "Tomatoes", status: "halal" },
      { name: "Anthocyanins (E163)", source: "Grapes/berries", status: "halal" },
    ],
    commonProducts: ["Fruit yogurts", "Juices", "Candies", "Lipstick", "Blush", "Some medications"],
    scholarlyOpinions: [
      { school: "Hanafi", opinion: "Insects are impure (najis); carmine is Haram." },
      { school: "Maliki", opinion: "Insects without flowing blood may be permissible, but most scholars prohibit carmine." },
      { school: "Shafi'i", opinion: "Insects are impure; carmine is Haram." },
      { school: "Hanbali", opinion: "Insects are impure; carmine is Haram." },
    ],
    quranReferences: [
      { surah: "Al-A'raf", ayah: "7:157", arabic: "وَيُحِلُّ لَهُمُ الطَّيِّبَاتِ وَيُحَرِّمُ عَلَيْهِمُ الْخَبَائِثَ", translation: "He allows them as lawful what is good and pure, and prohibits them from what is bad and impure." },
    ],
    hadithReferences: [],
  },
  {
    id: "lard",
    name: "Lard",
    eNumbers: [],
    otherNames: ["Pork fat", "Pig fat", "Saindoux", "Schmaltz (when pork-based)"],
    status: "haram",
    category: "animal-derived",
    source: "Rendered pig fat",
    shortDescription: "Rendered pig fat. Strictly Haram in Islam.",
    whatIsIt: "Lard is rendered pig fat, used in cooking, baking, and food manufacturing. It provides a flaky texture in pastries and is used as a cooking fat.",
    sourceDetails: "Lard is obtained by rendering (melting and filtering) the fatty tissue of pigs. It is commonly used in traditional baking and cooking in Western cuisines.",
    islamicRuling: "Lard is strictly Haram. Pork and all its derivatives are explicitly forbidden in the Quran.",
    whyItMatters: "Lard may be hidden in baked goods, pastries, refried beans, and some processed foods. It may be listed as 'animal fat' or 'shortening'.",
    howToIdentify: "Look for 'lard', 'pork fat', 'animal fat', or 'shortening' — shortening can be lard-based.",
    alternatives: [
      { name: "Vegetable shortening", source: "Plant oils", status: "halal" },
      { name: "Butter (from Halal source)", source: "Cow milk", status: "halal" },
      { name: "Coconut oil", source: "Coconut", status: "halal" },
    ],
    commonProducts: ["Pastries", "Pie crusts", "Refried beans", "Some biscuits", "Traditional cooking fats"],
    scholarlyOpinions: [
      { school: "All schools", opinion: "Unanimous: lard is Haram as it is derived directly from pork." },
    ],
    quranReferences: [
      { surah: "Al-Baqarah", ayah: "2:173", arabic: "إِنَّمَا حَرَّمَ عَلَيْكُمُ الْمَيْتَةَ وَالدَّمَ وَلَحْمَ الْخِنزِيرِ", translation: "He has only forbidden to you dead animals, blood, the flesh of swine..." },
    ],
    hadithReferences: [],
  },
  {
    id: "alcohol",
    name: "Alcohol (Ethanol)",
    eNumbers: [],
    otherNames: ["Ethyl alcohol", "Ethanol", "Grain alcohol", "Wine", "Beer", "Spirits"],
    status: "haram",
    category: "alcohol-based",
    source: "Fermentation of sugars by yeast",
    shortDescription: "Intoxicating alcohol. Haram in all forms when used as a beverage or in significant quantities.",
    whatIsIt: "Ethanol is the type of alcohol found in alcoholic beverages. It is produced by the fermentation of sugars. Small traces may appear in natural flavors, vanilla extract, and fermented foods.",
    sourceDetails: "Alcohol is produced through fermentation of carbohydrates (grains, fruits, sugars) by yeast. It is present in beer, wine, spirits, and many food flavorings.",
    islamicRuling: "Alcohol as a beverage is strictly Haram. Scholars differ on trace amounts in food — many permit it if it occurs naturally (e.g., in bread) or in negligible quantities (istihlak), while others prohibit any intentional addition.",
    whyItMatters: "Alcohol appears in vanilla extract, some flavorings, fermented foods, and even some medications. Understanding the context and quantity is important.",
    howToIdentify: "Look for 'alcohol', 'ethanol', 'wine', 'beer', 'spirits', 'rum', or 'brandy' in ingredient lists. 'Natural flavors' may contain alcohol-based extracts.",
    alternatives: [
      { name: "Alcohol-free vanilla extract", source: "Vanilla beans in glycerin", status: "halal" },
      { name: "Water-based flavorings", source: "Various", status: "halal" },
    ],
    commonProducts: ["Alcoholic beverages", "Vanilla extract", "Some flavorings", "Certain medications", "Mouthwash"],
    scholarlyOpinions: [
      { school: "Hanafi", opinion: "Grape/date alcohol is Haram in any amount. Other alcohols are Haram only in intoxicating quantities." },
      { school: "Maliki/Shafi'i/Hanbali", opinion: "All intoxicating substances are Haram regardless of source." },
    ],
    quranReferences: [
      { surah: "Al-Ma'idah", ayah: "5:90", arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِنَّمَا الْخَمْرُ وَالْمَيْسِرُ وَالْأَنصَابُ وَالْأَزْلَامُ رِجْسٌ مِّنْ عَمَلِ الشَّيْطَانِ", translation: "O you who have believed, indeed, intoxicants, gambling, [sacrificing on] stone altars, and divining arrows are but defilement from the work of Satan..." },
    ],
    hadithReferences: [
      { text: "Every intoxicant is khamr, and every khamr is forbidden.", source: "Sahih Muslim" },
    ],
  },
  {
    id: "rennet",
    name: "Rennet",
    eNumbers: [],
    otherNames: ["Animal rennet", "Calf rennet", "Chymosin", "Rennin"],
    status: "mushbooh",
    category: "animal-derived",
    source: "Stomach lining of young ruminants (calves, lambs) OR microbial/plant sources",
    shortDescription: "An enzyme used in cheese-making. Halal if from Halal-slaughtered animals or microbial/plant sources.",
    whatIsIt: "Rennet is a complex of enzymes (primarily chymosin/rennin) used to coagulate milk in cheese production. It can be derived from animal stomachs, microbial fermentation, or plants.",
    sourceDetails: "Traditional animal rennet comes from the stomach lining of young ruminants. Modern cheese often uses microbial rennet (from fungi) or fermentation-produced chymosin (FPC), which is vegetarian and generally Halal.",
    islamicRuling: "Animal rennet from Halal-slaughtered animals is Halal. Microbial and plant-based rennet is Halal. Rennet from non-Halal animals is Haram. Many scholars consider the transformation of rennet sufficient for Halal status.",
    whyItMatters: "Most cheeses contain rennet. Without knowing the source, cheese is Mushbooh. Look for 'vegetarian rennet', 'microbial rennet', or Halal certification.",
    howToIdentify: "Look for 'rennet', 'animal rennet', 'chymosin', or 'enzymes' in cheese ingredients. 'Vegetarian' or 'microbial' rennet is generally Halal.",
    alternatives: [
      { name: "Microbial rennet", source: "Fungi (Rhizomucor miehei)", status: "halal" },
      { name: "Fermentation-produced chymosin (FPC)", source: "Genetically modified yeast/fungi", status: "halal" },
      { name: "Plant rennet", source: "Fig leaves, nettles", status: "halal" },
    ],
    commonProducts: ["Cheese (all types)", "Some yogurts", "Cream cheese"],
    scholarlyOpinions: [
      { school: "Hanafi", opinion: "Rennet from Halal-slaughtered animals is Halal; transformation makes it permissible." },
      { school: "Maliki", opinion: "Rennet from any animal (even pig) is transformed enough to be Halal (minority view)." },
      { school: "Shafi'i/Hanbali", opinion: "Source matters; rennet from Halal animals is Halal, from Haram animals is Haram." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "glycerin",
    name: "Glycerin",
    eNumbers: ["E422"],
    otherNames: ["Glycerol", "Glycerine", "Vegetable glycerin", "E422"],
    status: "mushbooh",
    category: "animal-derived",
    source: "Animal fats (pork/beef) OR plant oils (palm, soy, coconut) OR synthetic",
    shortDescription: "A humectant and sweetener. Halal if from plant or synthetic sources; Haram if from pork.",
    whatIsIt: "Glycerin is a colorless, odorless, sweet-tasting liquid used as a humectant, solvent, and sweetener in food and cosmetics. It can be derived from animal fats, vegetable oils, or produced synthetically.",
    sourceDetails: "Glycerin is a byproduct of soap manufacturing and biodiesel production. When derived from animal fats, it may come from pork or beef. 'Vegetable glycerin' is always plant-based and Halal.",
    islamicRuling: "Glycerin is Mushbooh unless the source is specified. Vegetable glycerin is Halal. Synthetic glycerin is Halal. Animal-derived glycerin is Halal only if from Halal-slaughtered animals.",
    whyItMatters: "Glycerin is extremely common in processed foods, cosmetics, and medications. Without source specification, its Halal status is uncertain.",
    howToIdentify: "Look for 'glycerin', 'glycerol', 'E422'. 'Vegetable glycerin' is always Halal. Plain 'glycerin' without qualification is Mushbooh.",
    alternatives: [
      { name: "Vegetable glycerin", source: "Palm/coconut/soy oil", status: "halal" },
      { name: "Synthetic glycerol", source: "Petrochemical synthesis", status: "halal" },
    ],
    commonProducts: ["Baked goods", "Candy", "Cosmetics", "Toothpaste", "Medications", "Soap"],
    scholarlyOpinions: [
      { school: "General consensus", opinion: "Vegetable glycerin is Halal. Animal glycerin requires Halal source verification." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "emulsifiers-e471",
    name: "Mono- and Diglycerides of Fatty Acids",
    eNumbers: ["E471"],
    otherNames: ["Monoglycerides", "Diglycerides", "Glycerol monostearate", "GMS"],
    status: "mushbooh",
    category: "e-numbers",
    source: "Animal fats (pork/beef) OR plant oils",
    shortDescription: "Common emulsifier. Halal if from plant sources; Mushbooh if source is unspecified.",
    whatIsIt: "E471 is an emulsifier derived from glycerol and fatty acids. It is used to improve texture, extend shelf life, and blend water and oil in food products.",
    sourceDetails: "E471 can be derived from animal fats (including pork lard) or vegetable oils. In Western countries, animal-derived versions are common. Many manufacturers now use plant-based E471.",
    islamicRuling: "E471 is Mushbooh unless the source is confirmed as plant-based or from Halal-slaughtered animals. Pork-derived E471 is Haram.",
    whyItMatters: "E471 is one of the most common food additives, found in bread, margarine, chocolate, ice cream, and many processed foods.",
    howToIdentify: "Look for 'E471', 'mono- and diglycerides', 'monoglycerides', 'diglycerides'. Without source specification, treat as Mushbooh.",
    alternatives: [
      { name: "Sunflower lecithin (E322)", source: "Sunflower", status: "halal" },
      { name: "Soy lecithin (E322)", source: "Soy", status: "halal" },
    ],
    commonProducts: ["Bread", "Margarine", "Chocolate", "Ice cream", "Baked goods", "Peanut butter"],
    scholarlyOpinions: [
      { school: "General", opinion: "Source must be verified. Plant-based E471 is Halal; pork-derived is Haram." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "lecithin",
    name: "Lecithin",
    eNumbers: ["E322"],
    otherNames: ["Soy lecithin", "Sunflower lecithin", "Egg lecithin"],
    status: "mushbooh",
    category: "e-numbers",
    source: "Soy, sunflower, eggs, or animal tissue",
    shortDescription: "An emulsifier. Usually Halal (soy/sunflower), but egg or animal lecithin requires verification.",
    whatIsIt: "Lecithin is a fatty substance used as an emulsifier and lubricant in food processing. Soy and sunflower lecithin are the most common forms and are plant-based.",
    sourceDetails: "Most commercial lecithin is derived from soybeans or sunflower seeds. Egg lecithin is also used. Animal-derived lecithin (from animal tissue) is less common but exists.",
    islamicRuling: "Soy and sunflower lecithin are Halal. Egg lecithin is Halal. Animal-derived lecithin requires Halal source verification.",
    whyItMatters: "Lecithin is extremely common in chocolate, baked goods, and processed foods. Soy lecithin is almost always Halal.",
    howToIdentify: "Look for 'lecithin', 'E322', 'soy lecithin', 'sunflower lecithin'. If source is not specified, it is likely soy-based and Halal.",
    alternatives: [
      { name: "Sunflower lecithin", source: "Sunflower seeds", status: "halal" },
    ],
    commonProducts: ["Chocolate", "Baked goods", "Margarine", "Salad dressings", "Infant formula"],
    scholarlyOpinions: [
      { school: "General", opinion: "Plant-based lecithin is Halal. Animal lecithin requires Halal source." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "natural-flavors",
    name: "Natural Flavors",
    eNumbers: [],
    otherNames: ["Natural flavouring", "Natural flavor", "Flavor", "Flavoring"],
    status: "mushbooh",
    category: "hidden",
    source: "Plant, animal, or microbial sources — unspecified",
    shortDescription: "A catch-all term that may hide animal-derived or alcohol-based ingredients. Treat as Mushbooh.",
    whatIsIt: "Natural flavors are flavoring substances derived from natural sources (plants, animals, microorganisms). The FDA allows manufacturers to keep the exact source confidential under 'natural flavors'.",
    sourceDetails: "Natural flavors can be derived from fruits, vegetables, herbs, meat, seafood, poultry, eggs, dairy, or fermentation products. They may be extracted using alcohol.",
    islamicRuling: "Natural flavors are Mushbooh. They may contain animal-derived ingredients (including pork) or alcohol-based extracts. Without manufacturer confirmation, their Halal status cannot be determined.",
    whyItMatters: "Natural flavors appear in thousands of products. They are one of the most common ways Haram ingredients are hidden in food.",
    howToIdentify: "Look for 'natural flavor', 'natural flavoring', 'flavor'. Contact the manufacturer to ask about the source.",
    alternatives: [
      { name: "Certified Halal flavorings", source: "Various", status: "halal" },
      { name: "Specific plant-based flavors (e.g., vanilla bean)", source: "Plants", status: "halal" },
    ],
    commonProducts: ["Almost all processed foods", "Snacks", "Beverages", "Sauces", "Soups"],
    scholarlyOpinions: [
      { school: "General", opinion: "When in doubt, abstain. Contact manufacturers for clarification." },
    ],
    quranReferences: [],
    hadithReferences: [
      { text: "Leave what makes you doubt for what does not make you doubt.", source: "Tirmidhi, Nasai" },
    ],
  },
  {
    id: "l-cysteine",
    name: "L-Cysteine",
    eNumbers: ["E920"],
    otherNames: ["Cysteine", "L-Cysteine hydrochloride"],
    status: "mushbooh",
    category: "animal-derived",
    source: "Human hair, duck feathers, hog hair, or synthetic/bacterial fermentation",
    shortDescription: "An amino acid used in bread. Mushbooh — may be derived from human hair or hog hair.",
    whatIsIt: "L-Cysteine (E920) is an amino acid used as a dough conditioner in bread and baked goods. It strengthens gluten and improves dough handling.",
    sourceDetails: "L-Cysteine was traditionally derived from human hair (collected from barber shops, mainly in China) or duck/hog feathers. Modern production increasingly uses bacterial fermentation, which is Halal.",
    islamicRuling: "L-Cysteine from human hair is considered Haram by most scholars (using human body parts is prohibited). From hog hair, it is Haram. From duck feathers (from non-Halal slaughter), it is Haram. Synthetic or fermentation-derived L-Cysteine is Halal.",
    whyItMatters: "L-Cysteine is common in commercial bread, pizza dough, and baked goods. The source is rarely specified on labels.",
    howToIdentify: "Look for 'L-cysteine', 'cysteine', 'E920'. Contact the manufacturer to ask about the source.",
    alternatives: [
      { name: "Fermentation-derived L-Cysteine", source: "Bacterial fermentation", status: "halal" },
      { name: "Ascorbic acid (Vitamin C)", source: "Plant-based", status: "halal" },
    ],
    commonProducts: ["Commercial bread", "Pizza dough", "Bagels", "Pastries", "Crackers"],
    scholarlyOpinions: [
      { school: "General", opinion: "Human hair-derived L-Cysteine is Haram. Fermentation-derived is Halal." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "vanilla-extract",
    name: "Vanilla Extract",
    eNumbers: [],
    otherNames: ["Pure vanilla extract", "Vanilla flavoring"],
    status: "mushbooh",
    category: "alcohol-based",
    source: "Vanilla beans extracted in alcohol (typically 35% ethanol)",
    shortDescription: "Pure vanilla extract contains 35% alcohol. Mushbooh — many scholars permit trace amounts in cooked food.",
    whatIsIt: "Pure vanilla extract is made by soaking vanilla beans in an alcohol-water solution. The FDA requires pure vanilla extract to contain at least 35% alcohol.",
    sourceDetails: "The alcohol in vanilla extract is used as a solvent to extract flavor compounds. Most of the alcohol evaporates during cooking, but some remains in uncooked applications.",
    islamicRuling: "Scholars differ. Many Hanafi scholars permit vanilla extract in cooked foods where alcohol evaporates (istihlak). Others prohibit any intentional addition of alcohol. Vanilla powder or alcohol-free vanilla is always Halal.",
    whyItMatters: "Vanilla extract is used in baking, ice cream, and desserts. Alcohol-free alternatives are widely available.",
    howToIdentify: "Look for 'vanilla extract', 'pure vanilla extract'. 'Vanilla flavor' or 'artificial vanilla' may not contain alcohol.",
    alternatives: [
      { name: "Vanilla powder", source: "Vanilla beans (dried)", status: "halal" },
      { name: "Alcohol-free vanilla extract (glycerin-based)", source: "Vanilla beans in glycerin", status: "halal" },
      { name: "Vanilla bean paste", source: "Vanilla beans", status: "halal" },
    ],
    commonProducts: ["Baked goods", "Ice cream", "Cakes", "Cookies", "Puddings"],
    scholarlyOpinions: [
      { school: "Hanafi", opinion: "Permissible in cooked food where alcohol evaporates; avoid in uncooked applications." },
      { school: "Maliki/Shafi'i/Hanbali", opinion: "Avoid intentional addition of alcohol; use alcohol-free alternatives." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "whey",
    name: "Whey",
    eNumbers: [],
    otherNames: ["Whey protein", "Whey powder", "Dried whey", "Whey solids"],
    status: "mushbooh",
    category: "animal-derived",
    source: "Byproduct of cheese production (may use animal rennet)",
    shortDescription: "A dairy byproduct. Halal if produced without animal rennet, or if rennet source is Halal.",
    whatIsIt: "Whey is the liquid remaining after milk has been curdled and strained during cheese production. It is dried into whey powder and used as a protein supplement and food ingredient.",
    sourceDetails: "The Halal status of whey depends on the rennet used in cheese production. If animal rennet from non-Halal animals is used, many scholars consider the whey Mushbooh or Haram.",
    islamicRuling: "Whey from cheese made with microbial or plant rennet is Halal. Whey from cheese made with Halal animal rennet is Halal. Whey from cheese made with pork rennet is Haram according to most scholars.",
    whyItMatters: "Whey is extremely common in protein powders, baked goods, and processed foods. The rennet source is rarely specified.",
    howToIdentify: "Look for 'whey', 'whey protein', 'whey powder'. Check if the product has Halal certification.",
    alternatives: [
      { name: "Plant-based protein (pea, soy, rice)", source: "Plants", status: "halal" },
      { name: "Halal-certified whey protein", source: "Halal dairy", status: "halal" },
    ],
    commonProducts: ["Protein powders", "Baked goods", "Infant formula", "Processed cheese", "Snack bars"],
    scholarlyOpinions: [
      { school: "General", opinion: "Halal-certified whey is Halal. Unspecified whey is Mushbooh." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "pepsin",
    name: "Pepsin",
    eNumbers: [],
    otherNames: ["Porcine pepsin", "Gastric enzyme"],
    status: "mushbooh",
    category: "animal-derived",
    source: "Stomach lining of pigs (most common) or calves",
    shortDescription: "A digestive enzyme used in cheese and food processing. Haram if from pigs.",
    whatIsIt: "Pepsin is a digestive enzyme extracted from the stomach lining of animals. It is used in cheese production and as a food processing aid.",
    sourceDetails: "Most commercial pepsin is derived from porcine (pig) stomach lining. Bovine pepsin is also available. Microbial alternatives exist.",
    islamicRuling: "Porcine pepsin is Haram. Bovine pepsin from Halal-slaughtered animals is Halal. Microbial pepsin is Halal.",
    whyItMatters: "Pepsin may be present in cheese and some processed foods without being explicitly labeled.",
    howToIdentify: "Look for 'pepsin', 'gastric enzyme', or 'enzymes' in ingredient lists. Contact manufacturers for source information.",
    alternatives: [
      { name: "Microbial enzymes", source: "Fungi/bacteria", status: "halal" },
    ],
    commonProducts: ["Cheese", "Some processed foods", "Dietary supplements"],
    scholarlyOpinions: [
      { school: "General", opinion: "Porcine pepsin is Haram. Verify source before consuming products containing 'enzymes'." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "isinglass",
    name: "Isinglass",
    eNumbers: [],
    otherNames: ["Fish gelatin fining agent"],
    status: "halal",
    category: "animal-derived",
    source: "Dried swim bladders of fish",
    shortDescription: "A fining agent from fish used to clarify beer and wine. Halal as it is fish-derived, but the final product (alcohol) is Haram.",
    whatIsIt: "Isinglass is a substance obtained from the dried swim bladders of fish. It is used as a fining agent to clarify alcoholic beverages by binding to yeast and other particles.",
    sourceDetails: "Isinglass itself is fish-derived and Halal. However, it is primarily used in beer and wine production, which are Haram beverages.",
    islamicRuling: "Isinglass as an ingredient is Halal (fish-derived). However, products clarified with isinglass (beer, wine) are Haram due to their alcohol content.",
    whyItMatters: "Some vegetarians and vegans avoid isinglass-clarified products. For Muslims, the concern is the final product (alcohol), not the isinglass itself.",
    howToIdentify: "Isinglass is rarely listed on labels as it is a processing aid. It is used in beer and wine production.",
    alternatives: [],
    commonProducts: ["Beer", "Wine", "Some fruit juices"],
    scholarlyOpinions: [
      { school: "General", opinion: "Isinglass is Halal but the products it is used in (beer, wine) are Haram." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "shellac",
    name: "Shellac",
    eNumbers: ["E904"],
    otherNames: ["Lac resin", "Confectioner's glaze", "Resinous glaze"],
    status: "mushbooh",
    category: "animal-derived",
    source: "Secretions of the female lac insect (Kerria lacca)",
    shortDescription: "A resin from insects used as a glaze on candies and fruits. Mushbooh — derived from insects.",
    whatIsIt: "Shellac is a resin secreted by the female lac insect. It is used as a glazing agent on candies, pills, and some fruits to give a shiny appearance and extend shelf life.",
    sourceDetails: "Shellac is produced in India and Thailand. The lac insect secretes the resin on tree branches. Harvesting kills many insects.",
    islamicRuling: "Shellac is Mushbooh. Most scholars consider insects impure (najis), making shellac Haram. Some scholars permit it due to transformation (istihala). The Islamic Fiqh Academy considers it Haram.",
    whyItMatters: "Shellac is used on many candies, chocolate-covered nuts, and some fresh fruits as a wax coating.",
    howToIdentify: "Look for 'shellac', 'E904', 'confectioner's glaze', 'resinous glaze', 'lac resin', 'natural glaze'.",
    alternatives: [
      { name: "Carnauba wax (E903)", source: "Palm leaves", status: "halal" },
      { name: "Beeswax (E901)", source: "Bees", status: "mushbooh" },
    ],
    commonProducts: ["Candy coatings", "Chocolate-covered nuts", "Some fresh fruits", "Pills and tablets"],
    scholarlyOpinions: [
      { school: "Majority", opinion: "Haram as it is derived from insects." },
      { school: "Minority", opinion: "Permissible due to transformation (istihala)." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "cochineal",
    name: "Cochineal Extract",
    eNumbers: ["E120"],
    otherNames: ["Carmine", "Carminic acid", "Natural Red 4"],
    status: "haram",
    category: "animal-derived",
    source: "Crushed cochineal insects",
    shortDescription: "Same as Carmine (E120). Red dye from crushed insects. Haram.",
    whatIsIt: "Cochineal extract is the same as carmine — a red dye extracted from crushed female cochineal insects. See 'Carmine' for full details.",
    sourceDetails: "Derived from the Dactylopius coccus insect native to South America.",
    islamicRuling: "Haram. Derived from insects, which are considered impure (najis) by the majority of Islamic scholars.",
    whyItMatters: "Often listed as 'cochineal extract' instead of 'carmine' to obscure its insect origin.",
    howToIdentify: "Look for 'cochineal', 'cochineal extract', 'E120', 'carmine', 'carminic acid', 'natural red 4'.",
    alternatives: [
      { name: "Beet juice (E162)", source: "Beetroot", status: "halal" },
    ],
    commonProducts: ["Juices", "Yogurt", "Candies", "Cosmetics"],
    scholarlyOpinions: [
      { school: "Majority", opinion: "Haram as insects are impure." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "tallow",
    name: "Tallow",
    eNumbers: [],
    otherNames: ["Beef tallow", "Mutton tallow", "Animal fat", "Suet"],
    status: "mushbooh",
    category: "animal-derived",
    source: "Rendered fat from beef or mutton (or pork)",
    shortDescription: "Rendered animal fat. Halal if from Halal-slaughtered beef/mutton; Haram if from pork.",
    whatIsIt: "Tallow is rendered fat from ruminant animals (cattle, sheep). It is used in cooking, food manufacturing, and cosmetics.",
    sourceDetails: "Beef and mutton tallow from Halal-slaughtered animals is Halal. Pork tallow (lard) is Haram. 'Animal fat' on a label may be any of these.",
    islamicRuling: "Tallow from Halal-slaughtered animals is Halal. Pork tallow is Haram. 'Animal fat' without specification is Mushbooh.",
    whyItMatters: "Tallow is used in some baked goods, frying oils, and food coatings. It may be listed as 'animal fat'.",
    howToIdentify: "Look for 'tallow', 'animal fat', 'beef fat', 'suet'. Without Halal certification, treat as Mushbooh.",
    alternatives: [
      { name: "Vegetable oils", source: "Plants", status: "halal" },
    ],
    commonProducts: ["Some baked goods", "Frying oils", "McDonald's fries (historically)", "Cosmetics"],
    scholarlyOpinions: [
      { school: "General", opinion: "Halal if from Halal-slaughtered animals; Haram if from pork." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "msg",
    name: "Monosodium Glutamate (MSG)",
    eNumbers: ["E621"],
    otherNames: ["MSG", "Sodium glutamate", "Glutamic acid sodium salt"],
    status: "halal",
    category: "additives",
    source: "Fermentation of sugars (corn, sugarcane, tapioca)",
    shortDescription: "A flavor enhancer produced by fermentation. Generally Halal.",
    whatIsIt: "MSG is a sodium salt of glutamic acid, used as a flavor enhancer to intensify savory (umami) taste. It is produced through bacterial fermentation of carbohydrates.",
    sourceDetails: "Modern MSG is produced by fermenting starch, sugar beets, sugarcane, or molasses using bacteria. It is not derived from animal sources.",
    islamicRuling: "MSG produced by fermentation of plant-based carbohydrates is Halal. There are no Islamic concerns with MSG itself.",
    whyItMatters: "MSG has been controversial for health reasons (though scientific evidence does not support 'MSG sensitivity' claims). From a Halal perspective, it is generally permissible.",
    howToIdentify: "Look for 'MSG', 'monosodium glutamate', 'E621', 'sodium glutamate'.",
    alternatives: [],
    commonProducts: ["Chinese food", "Snack chips", "Soups", "Seasoning mixes", "Fast food"],
    scholarlyOpinions: [
      { school: "General", opinion: "Halal when produced from plant-based fermentation." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "sodium-nitrate",
    name: "Sodium Nitrate / Nitrite",
    eNumbers: ["E250", "E251"],
    otherNames: ["Sodium nitrite (E250)", "Sodium nitrate (E251)", "Potassium nitrate (E252)"],
    status: "halal",
    category: "additives",
    source: "Synthetic (mineral salts)",
    shortDescription: "Preservatives used in cured meats. Halal as they are synthetic mineral salts.",
    whatIsIt: "Sodium nitrate and nitrite are preservatives used in cured and processed meats to prevent bacterial growth (especially botulism) and maintain pink color.",
    sourceDetails: "These are synthetic mineral salts with no animal or alcohol components.",
    islamicRuling: "Sodium nitrate and nitrite are Halal as they are synthetic mineral salts. However, the meat products they are used in (pork products) may be Haram.",
    whyItMatters: "These preservatives themselves are Halal, but they are commonly used in pork products (bacon, ham). The concern is the meat, not the preservative.",
    howToIdentify: "Look for 'E250', 'E251', 'E252', 'sodium nitrite', 'sodium nitrate', 'potassium nitrate'.",
    alternatives: [],
    commonProducts: ["Bacon", "Ham", "Hot dogs", "Salami", "Cured meats"],
    scholarlyOpinions: [
      { school: "General", opinion: "The additives themselves are Halal; the concern is the animal source of the meat." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "whey-protein",
    name: "Whey Protein Isolate",
    eNumbers: [],
    otherNames: ["WPI", "Whey protein concentrate (WPC)", "Milk protein"],
    status: "mushbooh",
    category: "animal-derived",
    source: "Dairy (byproduct of cheese production)",
    shortDescription: "Concentrated dairy protein. Mushbooh — depends on rennet source used in cheese production.",
    whatIsIt: "Whey protein isolate is a highly purified form of whey protein, commonly used in sports nutrition and food products.",
    sourceDetails: "Same Halal concerns as regular whey — depends on the rennet used in the original cheese production process.",
    islamicRuling: "Halal if from cheese made with microbial or plant rennet, or Halal-certified animal rennet. Mushbooh if source is unspecified.",
    whyItMatters: "Extremely common in protein powders, bars, and sports nutrition products. Look for Halal-certified whey protein.",
    howToIdentify: "Look for 'whey protein', 'WPI', 'WPC', 'milk protein'. Check for Halal certification.",
    alternatives: [
      { name: "Pea protein", source: "Yellow peas", status: "halal" },
      { name: "Soy protein", source: "Soybeans", status: "halal" },
      { name: "Rice protein", source: "Brown rice", status: "halal" },
    ],
    commonProducts: ["Protein powders", "Protein bars", "Meal replacements", "Sports drinks"],
    scholarlyOpinions: [
      { school: "General", opinion: "Halal-certified whey protein is Halal. Unspecified is Mushbooh." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
  {
    id: "beeswax",
    name: "Beeswax",
    eNumbers: ["E901"],
    otherNames: ["White wax", "Yellow wax", "Cera alba", "Cera flava"],
    status: "halal",
    category: "animal-derived",
    source: "Honeybees",
    shortDescription: "Wax produced by bees. Generally considered Halal.",
    whatIsIt: "Beeswax is a natural wax produced by honey bees. It is used as a glazing agent, coating, and in cosmetics.",
    sourceDetails: "Beeswax is secreted by worker bees to build honeycomb. It is a natural product from bees, which are considered pure (tahir) in Islamic jurisprudence.",
    islamicRuling: "Beeswax is generally considered Halal. Bees and their products (honey, beeswax) are mentioned positively in the Quran.",
    whyItMatters: "Beeswax is used as a coating on some fruits, candies, and cheese rinds.",
    howToIdentify: "Look for 'beeswax', 'E901', 'cera alba', 'cera flava', 'white wax'.",
    alternatives: [
      { name: "Carnauba wax (E903)", source: "Palm leaves", status: "halal" },
    ],
    commonProducts: ["Candy coatings", "Cheese rinds", "Some fruits", "Cosmetics", "Lip balm"],
    scholarlyOpinions: [
      { school: "General", opinion: "Halal — bees and their products are pure in Islam." },
    ],
    quranReferences: [
      { surah: "An-Nahl", ayah: "16:68-69", arabic: "وَأَوْحَىٰ رَبُّكَ إِلَى النَّحْلِ", translation: "And your Lord inspired to the bee..." },
    ],
    hadithReferences: [],
  },
  {
    id: "carrageenan",
    name: "Carrageenan",
    eNumbers: ["E407"],
    otherNames: ["Irish moss extract", "Carrageen"],
    status: "halal",
    category: "additives",
    source: "Red seaweed (Chondrus crispus and related species)",
    shortDescription: "A seaweed-derived thickener and stabilizer. Always Halal.",
    whatIsIt: "Carrageenan is a natural polysaccharide extracted from red seaweed. It is used as a thickener, stabilizer, and gelling agent in dairy products, infant formula, and processed foods.",
    sourceDetails: "Carrageenan is 100% plant-based (seaweed). There are no animal or alcohol components.",
    islamicRuling: "Carrageenan is Halal. It is derived from seaweed with no animal or alcohol components.",
    whyItMatters: "Carrageenan is a common alternative to gelatin in dairy products and is always Halal.",
    howToIdentify: "Look for 'carrageenan', 'E407', 'Irish moss extract'.",
    alternatives: [],
    commonProducts: ["Dairy products", "Infant formula", "Deli meats", "Chocolate milk", "Ice cream"],
    scholarlyOpinions: [
      { school: "General", opinion: "Halal — plant-based (seaweed)." },
    ],
    quranReferences: [],
    hadithReferences: [],
  },
];

// Quick lookup map for analysis engine
export const INGREDIENT_MAP = new Map<string, Ingredient>(
  INGREDIENT_DATABASE.map((ing) => [ing.id, ing])
);

// All known Haram ingredient keywords for analysis
export const HARAM_KEYWORDS = [
  "pork", "pig", "swine", "lard", "bacon", "ham", "gelatin", "carmine", "cochineal",
  "e120", "alcohol", "wine", "beer", "spirits", "rum", "brandy", "whiskey", "vodka",
  "ethanol", "l-cysteine from hair", "human hair", "blood", "carnivore",
];

// Mushbooh keywords
export const MUSHBOOH_KEYWORDS = [
  "gelatin", "glycerin", "glycerol", "e422", "mono- and diglycerides", "e471",
  "natural flavor", "natural flavour", "rennet", "whey", "casein", "pepsin",
  "shellac", "e904", "tallow", "animal fat", "l-cysteine", "e920",
  "lecithin", "e322", "vanilla extract",
];

// Always Halal keywords
export const HALAL_KEYWORDS = [
  "water", "salt", "sugar", "flour", "wheat", "corn", "rice", "oat",
  "vegetable oil", "sunflower oil", "olive oil", "palm oil", "canola oil",
  "soy", "soybean", "tomato", "onion", "garlic", "spice", "pepper",
  "vitamin c", "ascorbic acid", "citric acid", "e330", "e300",
  "baking soda", "baking powder", "yeast", "pectin", "agar",
  "carrageenan", "e407", "msg", "e621", "turmeric", "e100",
  "caramel color", "e150", "annatto", "e160b",
];
