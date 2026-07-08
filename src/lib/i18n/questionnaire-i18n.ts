"use client";

import { useCallback } from "react";
import { useTranslation } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

type Bilingual = { en: string; so: string };

/** Step titles and descriptions keyed by StepConfig.id. */
const STEP_TEXT: Record<number, { title: Bilingual; description: Bilingual }> = {
  1: {
    title: { en: "Basic Information", so: "Macluumaadka Aasaasiga ah" },
    description: { en: "Tell us about yourself", so: "Noo sheeg wax kugu saabsan" },
  },
  2: {
    title: { en: "Your Religious Practice", so: "Dhaqankaaga Diineed" },
    description: { en: "Your own religious habits", so: "Caadooyinkaaga diineed" },
  },
  3: {
    title: { en: "Education", so: "Waxbarasho" },
    description: { en: "Your educational background", so: "Asalkaaga waxbarasho" },
  },
  4: {
    title: { en: "Employment", so: "Shaqo" },
    description: { en: "Your work situation", so: "Xaaladdaada shaqo" },
  },
  5: {
    title: { en: "Marriage & Family", so: "Guur & Qoys" },
    description: {
      en: "Your marriage history and family",
      so: "Taariikhdaada guur iyo qoyska",
    },
  },
  6: {
    title: { en: "Lifestyle", so: "Qaab-nololeed" },
    description: { en: "Your daily habits", so: "Caadooyinkaaga maalinlaha ah" },
  },
  7: {
    title: { en: "About You", so: "Wax Kugu Saabsan" },
    description: {
      en: "Your plans, personality, and interests",
      so: "Qorshayaashaada, shakhsiyaddaada, iyo xiisayaashaada",
    },
  },
  8: {
    title: { en: "Partner Preferences", so: "Doorbidyada Lammaanaha" },
    description: {
      en: "What you are looking for in a spouse",
      so: "Waxa aad ka doonayso xaas",
    },
  },
  9: {
    title: { en: "Profile Photo", so: "Sawirka Profile-ka" },
    description: {
      en: "Upload a clear photo — matches will see this on your profile",
      so: "Soo geli sawir cad — kuwa ku habboon ayaa ku arki doona profile-kaaga",
    },
  },
};

/** Question labels keyed by FieldConfig.name. */
const FIELD_LABELS: Record<string, Bilingual> = {
  age: { en: "Age", so: "Da'da" },
  country: { en: "Country", so: "Dalka" },
  city: { en: "City", so: "Magaalada" },
  height: { en: "Height (cm)", so: "Dhererka (sm)" },
  weight: { en: "Weight (kg)", so: "Miisaanka (kg)" },
  prayerFrequency: {
    en: "Do you perform the five daily prayers?",
    so: "Ma tukataa shanta salaadood ee maalinlaha ah?",
  },
  wearsHijab: { en: "Do you wear Hijab?", so: "Ma xijaabataa?" },
  education: { en: "Education Level", so: "Heerka Waxbarasho" },
  occupation: { en: "Employment Status", so: "Xaaladda Shaqo" },
  maritalStatus: { en: "Have you ever been married?", so: "Weligaa ma guursatay?" },
  hasChildren: { en: "Do you have children?", so: "Carruur ma leedahay?" },
  smokes: { en: "Do you smoke?", so: "Ma cabtaa sigaar?" },
  exercise: {
    en: "How often do you exercise?",
    so: "Immisa jeer ayaad jimicsi samaysaa?",
  },
  readyToRelocate: {
    en: "Ready to relocate?",
    so: "Ma diyaar u tahay inaad guurto meel kale?",
  },
  marriageTimeline: { en: "Marriage Timeline", so: "Wakhtiga Guurka" },
  loveLanguage: {
    en: "What is your love language?",
    so: "Waa maxay luuqadda jacaylkaaga?",
  },
  bio: {
    en: "Tell us about yourself (max 500 characters)",
    so: "Noo sheeg wax kugu saabsan (ugu badnaan 500 xaraf)",
  },
  qualities: {
    en: "Choose up to 10 qualities that describe you",
    so: "Dooro ilaa 10 sifo oo ku qeexaya",
  },
  hobbies: { en: "Choose your hobbies", so: "Dooro hiwaayadahaaga" },
  wantChildren: {
    en: "Do you want children?",
    so: "Ma doonaysaa carruur?",
  },
  familyInvolvement: {
    en: "Will family be involved in the process?",
    so: "Qoyska ma ku lug yeelanayaa howshan?",
  },
  livingSituation: {
    en: "Preferred living situation after marriage?",
    so: "Habka nololeed ee aad doorbidayso guurka ka dib?",
  },
  madhhab: {
    en: "Sect / madhhab preference",
    so: "Doorbidka madhhab / dariiqada",
  },
  polygynyOpenness: {
    en: "Are you open to polygyny / a second marriage?",
    so: "Ma u furan tahay guur labaad / laba xaas?",
  },
  languagesSpoken: {
    en: "Languages you speak",
    so: "Luuqadaha aad ku hadasho",
  },
  citizenshipStatus: {
    en: "Citizenship / visa situation",
    so: "Xaaladda jinsiyadda / fiisaha",
  },
  financialReadiness: {
    en: "Financial readiness for marriage",
    so: "Diyaargarowga dhaqaale ee guurka",
  },
  dealBreakers: {
    en: "Your deal-breakers (optional)",
    so: "Waxyaabaha aad diidayso (ikhtiyaari)",
  },
  pref_partnerBeard: {
    en: "Beard preference for your spouse",
    so: "Doorbidka garka ee xaaskaaga",
  },
  pref_partnerHijabLevel: {
    en: "Hijab / niqab preference for your spouse",
    so: "Doorbidka xijaab / niqaab ee xaaskaaga",
  },
  spousePrayerImportance: {
    en: "How important is it that your spouse prays regularly?",
    so: "Intee ayay muhiim u tahay in xaaskaagu si joogto ah u tukado?",
  },
  marrySomeoneWithChildren: {
    en: "Would you marry someone with children?",
    so: "Ma guursan lahayd qof carruur leh?",
  },
  pref_minAge: { en: "Preferred Min Age", so: "Da'da ugu Yar ee la Doorbidayo" },
  pref_maxAge: { en: "Preferred Max Age", so: "Da'da ugu Badan ee la Doorbidayo" },
  pref_minHeight: {
    en: "Preferred Min Height",
    so: "Dhererka ugu Gaaban ee la Doorbidayo",
  },
  pref_maxHeight: {
    en: "Preferred Max Height",
    so: "Dhererka ugu Dheer ee la Doorbidayo",
  },
  pref_preferredCountries: {
    en: "Preferred Countries",
    so: "Dalalka la Doorbidayo",
  },
  pref_educationLevel: {
    en: "Preferred Education",
    so: "Waxbarashada la Doorbidayo",
  },
  pref_religiousLevel: {
    en: "Preferred Religious Level",
    so: "Heerka Diineed ee la Doorbidayo",
  },
  pref_acceptDivorcee: {
    en: "Accept someone who is divorced?",
    so: "Ma aqbali lahayd qof la furay?",
  },
  pref_acceptWidow: {
    en: "Accept someone who is widowed?",
    so: "Ma aqbali lahayd qof carmal ah?",
  },
  pref_acceptChildren: {
    en: "Accept someone with children?",
    so: "Ma aqbali lahayd qof carruur leh?",
  },
  pref_maxDistance: { en: "Maximum Distance", so: "Masaafada ugu Badan" },
};

/** Option value translations keyed by the stored English value. */
const OPTION_LABELS: Record<string, Bilingual> = {
  // Religious levels
  "Very Practicing": { en: "Very Practicing", so: "Aad u Diinsan" },
  Practicing: { en: "Practicing", so: "Diinsan" },
  Moderate: { en: "Moderate", so: "Dhexdhexaad" },
  "Less Practicing": { en: "Less Practicing", so: "Wax yar Diinsan" },
  // Prayer frequency
  Always: { en: "Always", so: "Had iyo jeer" },
  "Most of the time": { en: "Most of the time", so: "Inta badan" },
  Sometimes: { en: "Sometimes", so: "Marmar" },
  Rarely: { en: "Rarely", so: "Dhif iyo naadir" },
  // Spouse prayer importance
  "Very important": { en: "Very important", so: "Aad muhiim u ah" },
  Preferred: { en: "Preferred", so: "La doorbidayo" },
  "No preference": { en: "No preference", so: "Doorbid ma jiro" },
  // Education levels
  "High School": { en: "High School", so: "Dugsi Sare" },
  Diploma: { en: "Diploma", so: "Diploma" },
  Bachelor: { en: "Bachelor", so: "Shahaadada Koowaad" },
  Master: { en: "Master", so: "Master" },
  PhD: { en: "PhD", so: "PhD (Dhakhtarnimo)" },
  Other: { en: "Other", so: "Kale" },
  // Occupation
  "Full Time": { en: "Full Time", so: "Wakhti Buuxa" },
  "Part Time": { en: "Part Time", so: "Wakhti Qayb ah" },
  "Business Owner": { en: "Business Owner", so: "Milkiile Ganacsi" },
  Student: { en: "Student", so: "Arday" },
  Unemployed: { en: "Unemployed", so: "Shaqo la'aan" },
  Retired: { en: "Retired", so: "Hawlgab" },
  // Marital status
  "Never married": { en: "Never married", so: "Weligay ma guursan" },
  Divorced: { en: "Divorced", so: "La furay" },
  Widowed: { en: "Widowed", so: "Carmal" },
  // Yes/No family
  Yes: { en: "Yes", so: "Haa" },
  No: { en: "No", so: "Maya" },
  Depends: { en: "Depends", so: "Way ku xiran tahay" },
  Maybe: { en: "Maybe", so: "Waa suurtogal" },
  // Frequency
  Never: { en: "Never", so: "Marnaba" },
  // Exercise
  Daily: { en: "Daily", so: "Maalin kasta" },
  Weekly: { en: "Weekly", so: "Toddobaadle" },
  // Marriage timeline
  Immediately: { en: "Immediately", so: "Isla markiiba" },
  "Within 3 months": { en: "Within 3 months", so: "Muddo 3 bilood gudahood" },
  "Within 6 months": { en: "Within 6 months", so: "Muddo 6 bilood gudahood" },
  "Within 1 year": { en: "Within 1 year", so: "Muddo 1 sano gudaheed" },
  "No timeline": { en: "No timeline", so: "Wakhti go'an ma jiro" },
  // Love languages
  "Words of Affirmation": {
    en: "Words of Affirmation",
    so: "Erayada Xaqiijinta",
  },
  "Acts of Service": { en: "Acts of Service", so: "Ficilada Adeegga" },
  "Receiving Gifts": { en: "Receiving Gifts", so: "Helida Hadiyadaha" },
  "Quality Time": { en: "Quality Time", so: "Waqtiga Tayada Leh" },
  "Physical Touch": { en: "Physical Touch", so: "Taabashada Jirka" },
  // Want children
  "Already have and open to more": {
    en: "Already have and open to more",
    so: "Horaan u leeyahay oo waan u furanahay in badan",
  },
  // Family involvement
  Somewhat: { en: "Somewhat", so: "Wax yar" },
  // Living situation
  "Same city": { en: "Same city", so: "Isla magaalada" },
  "Same country": { en: "Same country", so: "Isla dalka" },
  "Open to abroad": { en: "Open to abroad", so: "U furan dibadda" },
  "With family": { en: "With family", so: "Lala noolaado qoyska" },
  "Own home": { en: "Own home", so: "Gurigeyga gaarka ah" },
  // Madhhab
  "Sunni - no preference": {
    en: "Sunni - no preference",
    so: "Sunni - doorbid ma jiro",
  },
  "Shafi'i": { en: "Shafi'i", so: "Shaafici" },
  Hanafi: { en: "Hanafi", so: "Xanafi" },
  Maliki: { en: "Maliki", so: "Maaliki" },
  Hanbali: { en: "Hanbali", so: "Xanbali" },
  "Prefer not to say": { en: "Prefer not to say", so: "Ma doonayo inaan sheego" },
  // Beard / hijab preferences
  "Beard preferred": { en: "Beard preferred", so: "Gar la doorbido" },
  "Beard required": { en: "Beard required", so: "Gar waa loo baahan yahay" },
  "No beard preferred": { en: "No beard preferred", so: "Gar la'aan la doorbido" },
  "Hijab preferred": { en: "Hijab preferred", so: "Xijaab la doorbido" },
  "Niqab preferred": { en: "Niqab preferred", so: "Niqaab la doorbido" },
  "Hijab or niqab preferred": {
    en: "Hijab or niqab preferred",
    so: "Xijaab ama niqaab la doorbido",
  },
  // Languages
  Somali: { en: "Somali", so: "Soomaali" },
  English: { en: "English", so: "Ingiriisi" },
  Arabic: { en: "Arabic", so: "Carabi" },
  Swahili: { en: "Swahili", so: "Sawaaxiili" },
  French: { en: "French", so: "Faransiis" },
  Dutch: { en: "Dutch", so: "Hollandays" },
  Swedish: { en: "Swedish", so: "Isweden" },
  Norwegian: { en: "Norwegian", so: "Norwiiji" },
  German: { en: "German", so: "Jarmal" },
  // Citizenship
  "Citizen of country I live in": {
    en: "Citizen of country I live in",
    so: "Muwaadin dalka aan ku noolahay",
  },
  "Permanent resident": { en: "Permanent resident", so: "Degganaan joogto ah" },
  "Temporary visa / student / work": {
    en: "Temporary visa / student / work",
    so: "Fiiso ku meel gaar ah / arday / shaqo",
  },
  "Seeking visa / sponsorship needed": {
    en: "Seeking visa / sponsorship needed",
    so: "Fiiso raadinta / taageero ayaa loo baahan yahay",
  },
  // Financial
  "Ready to support a family": {
    en: "Ready to support a family",
    so: "Diyaar u ah inaan qoys quudiyo",
  },
  "We should both work": {
    en: "We should both work",
    so: "Labadeenaba waa inaan shaqaynaa",
  },
  "Still building financially": {
    en: "Still building financially",
    so: "Weli dhaqaale ahaan waan dhismayaa",
  },
  // Deal-breakers
  Smoking: { en: "Smoking", so: "Sigaar cabista" },
  "Does not pray regularly": {
    en: "Does not pray regularly",
    so: "Si joogto ah uma tukado",
  },
  "Already has children": {
    en: "Already has children",
    so: "Horey u leeyahay carruur",
  },
  "Does not want children": {
    en: "Does not want children",
    so: "Ma doonayo carruur",
  },
  "Lives in a different country": {
    en: "Lives in a different country",
    so: "Wuxuu ku nool yahay waddan kale",
  },
  "Not willing to relocate": {
    en: "Not willing to relocate",
    so: "Ma doonayo inuu guuro",
  },
  "Wants second marriage / polygyny": {
    en: "Wants second marriage / polygyny",
    so: "Wuxuu doonayaa guur labaad",
  },
  "No family involvement": {
    en: "No family involvement",
    so: "Qoysku ku lug ma laha",
  },
  // Max distance
  "Same City": { en: "Same City", so: "Isla Magaalada" },
  "Same Country": { en: "Same Country", so: "Isla Dalka" },
  Worldwide: { en: "Worldwide", so: "Adduunka oo dhan" },
  // Qualities
  Religious: { en: "Religious", so: "Diinsan" },
  Honest: { en: "Honest", so: "Daacad" },
  Kind: { en: "Kind", so: "Naxariis leh" },
  Patient: { en: "Patient", so: "Dulqaad leh" },
  Funny: { en: "Funny", so: "Kaftan leh" },
  Calm: { en: "Calm", so: "Deggan" },
  Romantic: { en: "Romantic", so: "Jacayl leh" },
  Loyal: { en: "Loyal", so: "Aamin" },
  Hardworking: { en: "Hardworking", so: "Shaqayste" },
  "Family Oriented": { en: "Family Oriented", so: "Qoys jecel" },
  "Financially Responsible": {
    en: "Financially Responsible",
    so: "Mas'uul dhaqaale ahaan",
  },
  Educated: { en: "Educated", so: "Wax barte" },
  "Good Communication": { en: "Good Communication", so: "Isgaarsiin wanaagsan" },
  Respectful: { en: "Respectful", so: "Ixtiraam leh" },
  Supportive: { en: "Supportive", so: "Taageero badan" },
  Confident: { en: "Confident", so: "Kalsooni leh" },
  Ambitious: { en: "Ambitious", so: "Hammi leh" },
  Generous: { en: "Generous", so: "Deeqsi" },
  // Hobbies
  Reading: { en: "Reading", so: "Akhris" },
  Cooking: { en: "Cooking", so: "Karin" },
  Travel: { en: "Travel", so: "Safar" },
  Gym: { en: "Gym", so: "Jimicsi" },
  Football: { en: "Football", so: "Kubadda Cagta" },
  Technology: { en: "Technology", so: "Tignoolajiyada" },
  Business: { en: "Business", so: "Ganacsi" },
  Nature: { en: "Nature", so: "Dabeecadda" },
  Gaming: { en: "Gaming", so: "Ciyaaraha" },
  Photography: { en: "Photography", so: "Sawir qaadis" },
  "Islamic Studies": { en: "Islamic Studies", so: "Cilmiga Islaamka" },
  Volunteering: { en: "Volunteering", so: "Iskaa wax u qabso" },
};

/** Review-screen section titles and row labels. */
const REVIEW_LABELS: Record<string, Bilingual> = {
  // Section titles
  "Basic Information": { en: "Basic Information", so: "Macluumaadka Aasaasiga ah" },
  "Your Religious Practice": { en: "Your Religious Practice", so: "Dhaqankaaga Diineed" },
  "Education & Work": { en: "Education & Work", so: "Waxbarasho & Shaqo" },
  "Marriage & Family": { en: "Marriage & Family", so: "Guur & Qoys" },
  Lifestyle: { en: "Lifestyle", so: "Qaab-nololeed" },
  "About You": { en: "About You", so: "Wax Kugu Saabsan" },
  "Partner Preferences": { en: "Partner Preferences", so: "Doorbidyada Lammaanaha" },
  "Profile Photo": { en: "Profile Photo", so: "Sawirka Profile-ka" },
  // Row labels
  Age: { en: "Age", so: "Da'da" },
  Country: { en: "Country", so: "Dalka" },
  City: { en: "City", so: "Magaalada" },
  Height: { en: "Height", so: "Dhererka" },
  Weight: { en: "Weight", so: "Miisaanka" },
  "Prayer Frequency": { en: "Prayer Frequency", so: "Salaadda" },
  "Wears Hijab": { en: "Wears Hijab", so: "Xijaab" },
  Education: { en: "Education", so: "Waxbarasho" },
  Occupation: { en: "Occupation", so: "Shaqo" },
  "Marital Status": { en: "Marital Status", so: "Xaaladda Guur" },
  Children: { en: "Children", so: "Carruur" },
  Smokes: { en: "Smokes", so: "Sigaar" },
  Exercise: { en: "Exercise", so: "Jimicsi" },
  "Ready to Relocate": { en: "Ready to Relocate", so: "Diyaar u ah Guuritaan" },
  "Marriage Timeline": { en: "Marriage Timeline", so: "Wakhtiga Guurka" },
  "Love Language": { en: "Love Language", so: "Luuqadda Jacaylka" },
  "Want Children": { en: "Want Children", so: "Rabitaanka Carruur" },
  "Family Involvement": { en: "Family Involvement", so: "Ka qaybgalka Qoyska" },
  "Living Situation": { en: "Living Situation", so: "Xaaladda Nololeed" },
  Madhhab: { en: "Madhhab", so: "Madhhab" },
  "Polygyny Openness": { en: "Polygyny Openness", so: "Furfurnaanta Guur Labaad" },
  Languages: { en: "Languages", so: "Luuqadaha" },
  "Citizenship / Visa": { en: "Citizenship / Visa", so: "Jinsiyad / Fiiso" },
  "Financial Readiness": { en: "Financial Readiness", so: "Diyaargarowga Dhaqaale" },
  "Deal-breakers": { en: "Deal-breakers", so: "Waxyaabaha Diidmada" },
  "Partner Beard": { en: "Partner Beard", so: "Garka Lammaanaha" },
  "Partner Hijab / Niqab": { en: "Partner Hijab / Niqab", so: "Xijaab / Niqaab Lammaanaha" },
  Bio: { en: "Bio", so: "Faahfaahin" },
  Qualities: { en: "Qualities", so: "Sifooyin" },
  Hobbies: { en: "Hobbies", so: "Hiwaayado" },
  "Spouse Prayer Importance": {
    en: "Spouse Prayer Importance",
    so: "Muhiimadda Salaadda Xaaska",
  },
  "Marry Someone With Children": {
    en: "Marry Someone With Children",
    so: "Guur Qof Carruur Leh",
  },
  "Preferred Age": { en: "Preferred Age", so: "Da'da la Doorbidayo" },
  "Preferred Height": { en: "Preferred Height", so: "Dhererka la Doorbidayo" },
  "Preferred Countries": { en: "Preferred Countries", so: "Dalalka la Doorbidayo" },
  "Preferred Education": { en: "Preferred Education", so: "Waxbarashada la Doorbidayo" },
  "Preferred Religious Level": {
    en: "Preferred Religious Level",
    so: "Heerka Diineed la Doorbidayo",
  },
  "Accept Divorcee": { en: "Accept Divorcee", so: "Aqbal Qof La Furay" },
  "Accept Widow": { en: "Accept Widow", so: "Aqbal Qof Carmal ah" },
  "Accept Children": { en: "Accept Children", so: "Aqbal Carruur" },
  "Max Distance": { en: "Max Distance", so: "Masaafada ugu Badan" },
  Photo: { en: "Photo", so: "Sawir" },
};

/** Static UI strings used across the questionnaire flow. */
const UI_TEXT = {
  edit: { en: "Edit", so: "Wax ka beddel" },
  finalReview: { en: "Final Review", so: "Dib u eegis Kama dambays ah" },
  editProfileDetails: {
    en: "Edit Profile Details",
    so: "Wax ka beddel Faahfaahinta Profile-ka",
  },
  reviewBeforeSubmitting: {
    en: "Review before submitting",
    so: "Dib u eeg ka hor gudbinta",
  },
  editModeDesc: {
    en: "Update any section below. Changes save when you finish editing a step.",
    so: "Cusboonaysii qayb kasta oo hoose. Isbeddelladu waxay kaydsanayaan marka aad dhammaysato tallaabada.",
  },
  reviewDesc: {
    en: "Review everything you've entered. You can edit any section before submitting.",
    so: "Dib u eeg dhammaan waxa aad gelisay. Waad wax ka beddeli kartaa qayb kasta ka hor gudbinta.",
  },
  saveChanges: { en: "Save Changes", so: "Kaydi Isbeddellada" },
  submitting: { en: "Submitting...", so: "Waa la gudbinayaa..." },
  submitProfile: { en: "Submit Profile", so: "Gudbi Profile-ka" },
  uploaded: { en: "Uploaded", so: "La soo geliyay" },
  anyValue: { en: "Any", so: "Mid kasta" },
  photoRequired: {
    en: "Please upload a profile photo before submitting.",
    so: "Fadlan soo geli sawir profile ah ka hor gudbinta.",
  },
  profileComplete: {
    en: "Profile complete! Finding your matches...",
    so: "Profile-ku waa dhammaystiran yahay! Waxaa la raadinayaa kuwa ku habboon...",
  },
  submitFailed: {
    en: "Failed to submit. Please try again.",
    so: "Gudbintu waa fashilantay. Fadlan mar kale isku day.",
  },
  // Phase-complete interstitial
  part1Complete: { en: "Part 1 complete", so: "Qaybta 1aad waa dhammaatay" },
  part2Complete: { en: "Part 2 complete", so: "Qaybta 2aad waa dhammaatay" },
  infoSaved: {
    en: "Your information is saved",
    so: "Macluumaadkaaga waa la kaydiyay",
  },
  prefsSaved: {
    en: "Partner preferences saved",
    so: "Doorbidyada lammaanaha waa la kaydiyay",
  },
  part1Desc: {
    en: "Great work — you've finished telling us about yourself. Next, share what you're looking for in a spouse.",
    so: "Waad ku mahadsan tahay — waxaad dhammaysay inaad noo sheegto wax kugu saabsan. Marka xigta, noo sheeg waxa aad ka doonayso xaas.",
  },
  part2Desc: {
    en: "You've finished both parts of your profile. Review your answers one last time, then submit.",
    so: "Waxaad dhammaysay labada qaybood ee profile-kaaga. Dib u eeg jawaabahaaga mar u dambaysa, ka dibna gudbi.",
  },
  aboutYouChip: { en: "About you", so: "Wax kugu saabsan" },
  partnerPrefsChip: { en: "Partner preferences", so: "Doorbidyada lammaanaha" },
  continueToPartner: {
    en: "Continue to Partner Preferences",
    so: "U gudub Doorbidyada Lammaanaha",
  },
  reviewAndSubmit: {
    en: "Review & Submit Profile",
    so: "Dib u eeg & Gudbi Profile-ka",
  },
  // Photo step
  photoTitle: { en: "Profile Photo", so: "Sawirka Profile-ka" },
  photoStepDesc: {
    en: "A photo is required. Other members will see it when browsing matches.",
    so: "Sawir waa lagama maarmaan. Xubnaha kale ayaa arki doona markay eegayaan kuwa ku habboon.",
  },
  chooseImageError: {
    en: "Please choose an image file.",
    so: "Fadlan dooro fayl sawir ah.",
  },
  photoUploaded: {
    en: "Profile photo uploaded!",
    so: "Sawirka profile-ka waa la soo geliyay!",
  },
  uploadFailed: {
    en: "Failed to upload image. Please try again.",
    so: "Sawirka lama soo gelin. Fadlan mar kale isku day.",
  },
  photoRequiredContinue: {
    en: "Please upload a profile photo before continuing.",
    so: "Fadlan soo geli sawir profile ah ka hor intaadan sii wadin.",
  },
  uploadYourPhoto: {
    en: "Upload your profile picture",
    so: "Soo geli sawirkaaga profile-ka",
  },
  photoHelp: {
    en: "Use a clear, recent photo of yourself. This helps serious matches recognize you.",
    so: "Isticmaal sawir cad oo dhow oo adiga ah. Tani waxay ka caawinaysaa kuwa dhab ah inay ku aqoonsadaan.",
  },
  uploading: { en: "Uploading...", so: "Waa la soo gelinayaa..." },
  changePhoto: { en: "Change Photo", so: "Beddel Sawirka" },
  choosePhoto: { en: "Choose Photo", so: "Dooro Sawir" },
  uploadPhotoAria: {
    en: "Upload profile photo",
    so: "Soo geli sawir profile ah",
  },
  saveAndContinue: { en: "Save & Continue", so: "Kaydi & Sii wad" },
  submitAndContinue: { en: "Submit & Continue", so: "Gudbi & Sii wad" },
  saveAndContinueToPhoto: {
    en: "Save & Continue to Photo",
    so: "Kaydi & U gudub Sawirka",
  },
  submitAndReview: {
    en: "Submit & Review Profile",
    so: "Gudbi & Dib u eeg Profile-ka",
  },
  autoSaveOn: { en: "Auto-save on", so: "Kaydinta tooska ah" },
  questionOf: { en: "Question {current} of {total}", so: "Su'aal {current} / {total}" },
  nextQuestion: { en: "Next question", so: "Su'aasha xigta" },
  previousQuestion: { en: "Previous", so: "Dib u noqo" },
  saving: { en: "Saving...", so: "Waa la kaydinayaa..." },
  saved: { en: "Saved", so: "La kaydiyay" },
  saveFailed: { en: "Save failed", so: "Kaydintu waa fashilantay" },
  selectOption: { en: "Please select an option", so: "Fadlan dooro hal xulasho" },
  requiredField: { en: "This field is required", so: "Meeshan waa loo baahan yahay" },
  selectAtLeastOne: {
    en: "Please select at least one option",
    so: "Fadlan dooro ugu yaraan hal xulasho",
  },
  answerAllRequired: {
    en: "Please answer all required questions before continuing.",
    so: "Fadlan ka jawaab dhammaan su'aalaha loo baahan yahay ka hor intaadan sii wadin.",
  },
  bioPlaceholder: {
    en: "Tell us about yourself...",
    so: "Noo sheeg wax kugu saabsan...",
  },
  selectPlaceholder: { en: "Select", so: "Dooro" },
  selectCity: { en: "Select city", so: "Dooro magaalada" },
  enterCity: { en: "Enter your city", so: "Geli magaaladaada" },
  // Questionnaire page header / flow
  profileQuestionnaire: { en: "Profile Questionnaire", so: "Su'aalaha Profile-ka" },
  part1CompleteSub: {
    en: "Part 1 complete — ready for partner preferences",
    so: "Qaybta 1aad waa dhammaatay — diyaar u ah doorbidyada lammaanaha",
  },
  reviewUpdateSub: {
    en: "Review and update your profile",
    so: "Dib u eeg oo cusboonaysii profile-kaaga",
  },
  reviewAnswersSub: {
    en: "Review your answers before submitting",
    so: "Dib u eeg jawaabahaaga ka hor gudbinta",
  },
  finalStepPhotoSub: {
    en: "Final step — upload your profile photo",
    so: "Tallaabada u dambaysa — soo geli sawirkaaga profile-ka",
  },
  part2Sub: {
    en: "Part 2 — What you're looking for in a spouse",
    so: "Qaybta 2aad — Waxa aad ka doonayso xaas",
  },
  part1AboutPrefix: {
    en: "Part 1 — About you",
    so: "Qaybta 1aad — Wax kugu saabsan",
  },
  badgeReview: { en: "Review", so: "Dib u eegis" },
  badgePhoto: { en: "Photo", so: "Sawir" },
  badgePart2: { en: "Part 2", so: "Qaybta 2aad" },
  badgeQuestionnaire: { en: "Questionnaire", so: "Su'aalo" },
  stepWord: { en: "Step", so: "Tallaabo" },
  profileCompleteFooter: {
    en: "{p}% profile complete · Auto-saves as you go",
    so: "{p}% profile-ka ayaa dhammaystiran · Si toos ah ayuu u kaydsanayaa",
  },
  part2CalloutTitle: {
    en: "Part 2: What you want in a spouse",
    so: "Qaybta 2aad: Waxa aad ka rabto xaas",
  },
  part2CalloutDesc: {
    en: "You finished your own details. Now answer the questions below about your ideal partner.",
    so: "Waxaad dhammaysay faahfaahintaada. Hadda ka jawaab su'aalaha hoose ee ku saabsan lammaanahaaga ku habboon.",
  },
  back: { en: "Back", so: "Dib u noqo" },
  changesSaved: { en: "Changes saved", so: "Isbeddellada waa la kaydiyay" },
  part1SavedToast: {
    en: "Part 1 saved! Now tell us what you want in a partner.",
    so: "Qaybta 1aad waa la kaydiyay! Hadda noo sheeg waxa aad ka rabto lammaane.",
  },
  partnerToast: {
    en: "Great! Now tell us what you're looking for in a partner.",
    so: "Aad baad u fiican tahay! Hadda noo sheeg waxa aad ka raadinayso lammaane.",
  },
  almostDoneToast: {
    en: "Almost done! Upload your profile photo.",
    so: "Ku dhow inaad dhammayso! Soo geli sawirkaaga profile-ka.",
  },
  saveFailedToast: {
    en: "Failed to save. Please try again.",
    so: "Lama kaydin. Fadlan mar kale isku day.",
  },
  photoSavedToast: {
    en: "Photo saved! Review your profile before submitting.",
    so: "Sawirka waa la kaydiyay! Dib u eeg profile-kaaga ka hor gudbinta.",
  },
  photoUpdatedToast: {
    en: "Photo updated.",
    so: "Sawirka waa la cusboonaysiiyay.",
  },
  profileCompleteTitle: {
    en: "Profile Complete",
    so: "Profile-ku waa Dhammaystiran",
  },
  profileReadySub: {
    en: "Your profile is ready. Start browsing your matches!",
    so: "Profile-kaagu waa diyaar. Bilow inaad eegto kuwa ku habboon!",
  },
  viewMatches: { en: "View Matches", so: "Eeg Kuwa Ku Habboon" },
  myProfile: { en: "My Profile", so: "Profile-kayga" },
  profileNotFound: {
    en: "Profile not found. Please try refreshing.",
    so: "Profile lama helin. Fadlan dib u cusboonaysii.",
  },
  goToDashboard: { en: "Go to Dashboard", so: "Aad Dashboard-ka" },
  completePaymentFirst: {
    en: "Complete payment first",
    so: "Marka hore dhammaystir lacag bixinta",
  },
  payToUnlock: {
    en: "Pay the registration fee to unlock your profile questionnaire.",
    so: "Bixi lacagta diiwaangelinta si aad u furto su'aalaha profile-kaaga.",
  },
} as const;

export type QuestionnaireUiKey = keyof typeof UI_TEXT;

export function useQuestionnaireI18n() {
  const { locale } = useTranslation();

  const stepTitle = useCallback(
    (id: number, fallback: string) =>
      STEP_TEXT[id]?.title[locale as Locale] ?? fallback,
    [locale]
  );

  const stepDescription = useCallback(
    (id: number, fallback: string) =>
      STEP_TEXT[id]?.description[locale as Locale] ?? fallback,
    [locale]
  );

  const fieldLabel = useCallback(
    (name: string, fallback: string) =>
      FIELD_LABELS[name]?.[locale as Locale] ?? fallback,
    [locale]
  );

  const optionLabel = useCallback(
    (value: string) => OPTION_LABELS[value]?.[locale as Locale] ?? value,
    [locale]
  );

  const reviewLabel = useCallback(
    (label: string) => REVIEW_LABELS[label]?.[locale as Locale] ?? label,
    [locale]
  );

  const ui = useCallback(
    (key: QuestionnaireUiKey) => UI_TEXT[key][locale as Locale],
    [locale]
  );

  return {
    locale,
    stepTitle,
    stepDescription,
    fieldLabel,
    optionLabel,
    reviewLabel,
    ui,
  };
}
