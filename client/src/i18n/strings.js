// strings.js
//
// UI chrome strings only. Chat replies themselves come from the server
// (routes/chat.js) or the offline fallback in aiClient.js, since those need
// to vary by message content, not just be a fixed translation table.

export const strings = {
  en: {
    appName: "DrugPhobia AI",
    tagline: "You are safe here. We're here to help.",
    disclaimer:
      "DrugPhobia AI provides information only. Not medical advice or therapy. For emergencies call 999 or Police 999. NDA Helpline 0808 20 20 (verify locally).",
    disclaimerAccept: "I understand",
    navHome: "Chat",
    navQuiz: "Quiz",
    navResources: "Get Help",
    navDidYouKnow: "Did You Know?",
    chatPlaceholder: "Type a message… you don't need to give your name.",
    send: "Send",
    getHelpNow: "Get Help Now",
    crisisHeading: "You are not alone. Help is 1 tap away.",
    crisisLockLabel: "I'm safe now",
    ageBanner: "If you're comfortable, please talk to a trusted adult too. You can also call Childline Zimbabwe — it's free, and confidential.",
    ageBannerCall: "Call Childline 116",
    peerChat: "Anonymous Peer Chat",
    quizScore: "Your score",
    quizRetake: "Try again",
    resourcesHelplines: "Helplines",
    resourcesFacilities: "Nearby facilities",
    verifyNotice: "Some contact details on this page are still being verified — see the note on each entry.",
    languageLabel: "Language",
  },
  sn: {
    appName: "DrugPhobia AI",
    tagline: "Uri safe pano. Tiri kukubatsira.",
    disclaimer:
      "DrugPhobia AI inongopa ruzivo chete. Haisi mazano echiremba kana kurapwa. Kana paine dambudziko rinokurumidza fonera 999 kana Mapurisa 999. NDA Helpline 0808 20 20 (simbisa panzvimbo).",
    disclaimerAccept: "Ndanzwisisa",
    navHome: "Kutaura",
    navQuiz: "Bvunzo",
    navResources: "Tsvaga Rubatsiro",
    navDidYouKnow: "Waiziva Here?",
    chatPlaceholder: "Nyora mashoko… hautombofaniri kupa zita rako.",
    send: "Tumira",
    getHelpNow: "Tsvaga Rubatsiro Izvozvi",
    crisisHeading: "Hausi wega. Rubatsiro rwuri padyo.",
    crisisLockLabel: "Ndachengeteka izvozvi",
    ageBanner: "Kana uchida, taurawo nemunhu mukuru waunovimba naye. Unogonawo kufonera Childline Zimbabwe — mahara, uye hazvizivikanwe.",
    ageBannerCall: "Fonera Childline 116",
    peerChat: "Kutaura Nevamwe Vasingazivikanwe",
    quizScore: "Zvawapedza",
    quizRetake: "Edza Zvakare",
    resourcesHelplines: "Nhare Dzerubatsiro",
    resourcesFacilities: "Zvipatara zviri pedyo",
    verifyNotice: "Mamwe mazita erunhare ari panapa achiri kusimbiswa — ona tsamba pane chinhu chimwe nechimwe.",
    languageLabel: "Mutauro",
  },
  nd: {
    appName: "DrugPhobia AI",
    tagline: "Uphephile lapha. Sikhona ukukusiza.",
    disclaimer:
      "DrugPhobia AI inikeza ulwazi kuphela. Akusiyo iseluleko sikadokotela noma ukwelulekwa. Uma kuphuthuma fonela u-999 noma amaPhoyisa 999. I-NDA Helpline 0808 20 20 (qinisekisa endaweni yakho).",
    disclaimerAccept: "Ngiyaqonda",
    navHome: "Ingxoxo",
    navQuiz: "Umbuzo",
    navResources: "Thola Usizo",
    navDidYouKnow: "Ubuyazi Yini?",
    chatPlaceholder: "Bhala umlayezo… awudingi ukunikeza ibizo lakho.",
    send: "Thumela",
    getHelpNow: "Thola Usizo Manje",
    crisisHeading: "Awuwedwa. Usizo lukhona ngokuthepha okukodwa.",
    crisisLockLabel: "Sengiphephile manje",
    ageBanner: "Uma ukhululekile, khuluma nomuntu omdala omethembayo futhi. Ungabuye ufonele iChildline Zimbabwe — mahhala, futhi kuyimfihlo.",
    ageBannerCall: "Fonela iChildline 116",
    peerChat: "Ingxoxo Engaziwa",
    quizScore: "Amaphuzu akho",
    quizRetake: "Zama Futhi",
    resourcesHelplines: "Izinombolo Zosizo",
    resourcesFacilities: "Izikhungo eziseduze",
    verifyNotice: "Eminye imininingwane yokuxhumana kulesi sikhangiso isaqinisekiswa — bheka inothi kuyo yonke into.",
    languageLabel: "Ulimi",
  },
};

export function t(lang, key) {
  return strings[lang]?.[key] ?? strings.en[key] ?? key;
}
