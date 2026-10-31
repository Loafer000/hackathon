import React, { useState, useEffect } from 'react'
import {
  Mic,
  Volume2,
  VolumeX,
  Play,
  Square,
  X,
  Languages,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { useApp, actions } from '../lib/store'
import { useT, LANG_NAMES } from '../lib/i18n'
import { CATEGORIES } from '../lib/data'
import type { Lang, CategoryId } from '../lib/types'

interface VoiceGuideModalProps {
  isOpen: boolean
  onClose: () => void
  initialCategory?: CategoryId
}

const VOICE_SCRIPTS: Record<Lang, Record<string, string>> = {
  en: {
    general:
      'Welcome to Waste to Worth. Remember the golden rule: keep wet food waste strictly separate from dry recyclables. Empty, rinse, and dry all plastic and glass bottles. Never mix toxic batteries or sanitary waste with household dry waste.',
    organic:
      'Wet waste: Fruit peels, cooked food, tea leaves, and garden cuttings. Drain excess gravy or liquid. Never use a plastic liner inside the compost bin.',
    plastic:
      'Plastic waste: Milk pouches, drink bottles, containers, and carry bags. Cut open milk pouches, rinse with water, and let them dry before placing in the blue bag.',
    paper:
      'Paper and cardboard: Flatten all courier boxes and newspapers. Please keep them dry. Oily or food-stained pizza boxes must go into the wet organic bin.',
    metal:
      'Metal waste: Beverage cans, food tins, and utensils. Rinse out remaining food. Flatten soft aluminum cans to save space.',
    glass:
      'Glass bottles and jars: Keep bottles intact. Wrap broken glass securely in thick newspaper and clearly label it for the collector’s safety.',
    ewaste:
      'Electronic waste: Mobile phones, chargers, wires, and broken appliances. Never dismantle or burn e-waste. Give directly to authorized recyclers.',
    hazardous:
      'Household hazardous: Old batteries, fluorescent tube lights, leftover paint, and expired medicines. Keep in a separate sealed box out of reach of children.',
    sanitary:
      'Sanitary waste: Diapers, sanitary napkins, and medical bandages. Wrap tightly in newspaper and mark with a red X for sanitary disposal.',
  },
  hi: {
    general:
      'वेस्ट टू वर्थ में आपका स्वागत है। याद रखें: गीला रसोई का कचरा और सूखा कचरा हमेशा अलग रखें। प्लास्टिक और कांच की बोतलों को खाली करके धोकर सुखाएँ। बैटरी और सैनिटरी कचरे को कभी सूखे कचरे में न मिलाएँ।',
    organic:
      'गीला कचरा: फलों के छिलके, बचा हुआ खाना, चाय की पत्ती और सूखे पत्ते। अतिरिक्त पानी या तरी निकाल दें। कूड़ेदान में प्लास्टिक की थैली न लगाएँ।',
    plastic:
      'प्लास्टिक कचरा: दूध की थैलियाँ, पीने की बोतलें, डिब्बे और साफ पन्नी। दूध की थैली को पूरा काटकर पानी से धोएँ और सुखाकर नीले डिब्बे में रखें।',
    paper:
      'कागज़ व गत्ता: डिब्बे और अखबारों को चपटा करें। इन्हें सूखा रखें। तेल या खाने से सने पिज़्ज़ा बॉक्स को गीले कचरे में ही डालें।',
    metal:
      'धातु का कचरा: कोल्ड ड्रिंक के डिब्बे, टिन और पुराने बर्तन। खाना धोकर निकालें। हो सके तो एल्युमिनियम कैन दबा दें।',
    glass:
      'कांच: बोतलें और कांच के जार। इन्हें तोड़ें नहीं। टूटे कांच को अखबार में अच्छी तरह लपेटकर ऊपर “कांच” लिखें ताकि कर्मचारी को चोट न लगे।',
    ewaste:
      'ई-कचरा: पुराने मोबाइल, चार्जर, तार और खराब बल्ब। ई-कचरे को कभी जलाएँ या तोड़ें नहीं। इसे अधिकृत रीसाइक्लर को ही सौंपें।',
    hazardous:
      'घरेलू खतरनाक कचरा: पुरानी बैटरियाँ, ट्यूबलाइट, सीएफएल, बची दवाइयाँ और कीटनाशक। इन्हें अलग बंद डिब्बे में सुरक्षित रखें।',
    sanitary:
      'सैनिटरी कचरा: डायपर, नैपकिन और पट्टियाँ। इन्हें अखबार में लपेटें और बाहर लाल क्रॉस का निशान लगाएँ।',
  },
  mr: {
    general:
      'वेस्ट टू वर्थ मध्ये आपले स्वागत आहे. मुख्य नियम लक्षात ठेवा: ओला व सुका कचरा नेहमी वेगवेगळा ठेवा. प्लास्टिकच्या बाटल्या धुवून वाळवा. बॅटरी व सॅनिटरी कचरा कधीही सुक्या कचऱ्यात मिसळू नका.',
    organic:
      'ओला कचरा: भाजीचे देठ, फळांची साले, शिळे अन्न, चहाची पत्ती. पाणी पूर्ण निथळून घ्या. कचराकुंडीत प्लास्टिक पिशवी घालू नका.',
    plastic:
      'प्लास्टिक कचरा: दुधाच्या पिशव्या, बाटल्या, डबे व पाकिटे. दुधाची पिशवी कापून धुवून सुकवून मगच जमा करा.',
    paper:
      'कागद व पुठ्ठा: खोकी चपटी करून ठेवा. कागद कोरडा ठेवा. तेलकट पिझ्झा बॉक्स ओल्या कचऱ्यात टाका.',
    metal:
      'धातू: टिन, कॅन व जुनी भांडी. धुवून अन्न साफ करा आणि डबे दाबून ठेवा.',
    glass:
      'काच: बाटल्या व बरण्या. काच फुटू देऊ नका. फुटलेली काच कागदात घट्ट गुंडाळून त्यावर काच असे लिहा.',
    ewaste:
      'ई-कचरा: मोबाईल, चार्जर, वायर व दिवे. कधीही जाळू नका किंवा तोडू नका. थेट अधिकृत कलेक्टर्सना द्या.',
    hazardous:
      'घातक कचरा: बॅटरी, ट्यूबलाइट, औषधे व कीटकनाशके. एका वेगळ्या बंद पेटीत ठेवा.',
    sanitary:
      'सॅनिटरी कचरा: डायपर, सॅनिटरी पॅड्स व मलमपट्टी. कागदात गुंडाळून त्यावर लाल रंगाची खूण करा.',
  },
  bn: {
    general:
      'ওয়েস্ট টু ওয়ার্থে স্বাগতম। মূল নিয়ম মনে রাখবেন: ভেজা ও শুকনো বর্জ্য সবসময় আলাদা রাখুন। প্লাস্টিকের বোতল ধুয়ে শুকিয়ে রাখুন। ব্যাটারি ও স্যানিটারি বর্জ্য সাধারণ শুকনো বর্জ্যে মেশাবেন না।',
    organic:
      'ভেজা বর্জ্য: শাকসবজির খোসা, খাবারের উচ্ছিষ্ট, চা-পাতা ও শুকনো পাতা। অতিরিক্ত জল ঝরিয়ে নিন। বিনে প্লাস্টিক ব্যাগ দেবেন না।',
    plastic:
      'প্লাস্টিক বর্জ্য: দুধের প্যাকেট, পানীয়ের বোতল ও কৌটো। দুধের প্যাকেট পুরো কেটে ধুয়ে শুকিয়ে তারপর জমা দিন।',
    paper:
      'কাগজ ও পিচবোর্ড: পার্সেলের বাক্স চ্যাপ্টা করুন। শুকনো রাখুন। তেলতেলে পিৎজা বাক্স ভেজা বর্জ্যে ফেলবেন।',
    metal:
      'ধাতব বর্জ্য: টিনের কৌটো, ফয়েল ও পুরনো বাসন। খাবার ধুয়ে ফেলুন। পারলে ক্যান চেপে দিন।',
    glass:
      'কাচের বোতল: কাচ ভাঙবেন না। ভাঙা কাচ পুরু খবরের কাগজে মুড়ে উপরে স্পষ্ট করে “কাচ” লিখুন।',
    ewaste:
      'ই-বর্জ্য: মোবাইল, চার্জার, তার ও ভাঙা বৈদ্যুতিক সরঞ্জাম। পোড়াবেন না বা ভাঙবেন না।',
    hazardous:
      'বিপজ্জনক বর্জ্য: পুরনো ব্যাটারি, টিউবলাইট ও মেয়াদোত্তীর্ণ ওষুধ। আলাদা বন্ধ বাক্সে রাখুন।',
    sanitary:
      'স্যানিটারি বর্জ্য: ডায়াপার, প্যাড ও ব্যান্ডেজ। খবরের কাগজে শক্ত করে মুড়ে লাল রঙের ক্রস চিহ্ন দিন।',
  },
}

export function VoiceGuideModal({ isOpen, onClose, initialCategory }: VoiceGuideModalProps) {
  const { session } = useApp()
  const { lang } = useT()
  const [selectedTopic, setSelectedTopic] = useState<string>(initialCategory || 'general')
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeLang, setActiveLang] = useState<Lang>(lang)
  const [speechSupported, setSpeechSupported] = useState(true)

  useEffect(() => {
    setActiveLang(lang)
  }, [lang])

  useEffect(() => {
    if (initialCategory) {
      setSelectedTopic(initialCategory)
    }
  }, [initialCategory])

  useEffect(() => {
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setSpeechSupported(false)
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function stopAudio() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }

  function playAudio(topic: string, language: Lang) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false)
      return
    }

    window.speechSynthesis.cancel()
    const script = VOICE_SCRIPTS[language][topic] || VOICE_SCRIPTS.en[topic] || ''
    if (!script) return

    const utterance = new SpeechSynthesisUtterance(script)
    utterance.rate = 0.9
    utterance.pitch = 1.0

    // Set locale code
    const langCodeMap: Record<Lang, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
    }
    utterance.lang = langCodeMap[language] || 'en-IN'

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices()
    const match = voices.find((v) => v.lang.startsWith(utterance.lang) || v.lang.startsWith(language))
    if (match) utterance.voice = match

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    window.speechSynthesis.speak(utterance)
  }

  function handleSelectTopic(topicId: string) {
    setSelectedTopic(topicId)
    if (isPlaying) {
      stopAudio()
      playAudio(topicId, activeLang)
    }
  }

  function togglePlay() {
    if (isPlaying) {
      stopAudio()
    } else {
      playAudio(selectedTopic, activeLang)
    }
  }

  if (!isOpen) return null

  const currentScript = VOICE_SCRIPTS[activeLang][selectedTopic] || VOICE_SCRIPTS.en[selectedTopic] || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#fafbf7] border border-[#dce0d4] shadow-2xl overflow-hidden text-[#18392b]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e2e6dc] bg-[#f0f4ea] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#183f32] text-[#dff47d] shadow-sm">
              <Mic size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#527031]">
                Voice Segregation Assistant
              </div>
              <h2 className="font-display text-lg sm:text-xl text-[#183f32] leading-tight">
                Listen to Local Segregation Rules
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              stopAudio()
              onClose()
            }}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#d2d9cc] bg-white text-[#526359] hover:bg-[#e6ebe0]"
            aria-label="Close voice guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* Language Selection Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-2.5 border border-[#e1e6db]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#516358]">
              <Languages size={15} /> Spoken Language:
            </div>
            <div className="flex items-center gap-1">
              {(['en', 'hi', 'mr', 'bn'] as Lang[]).map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setActiveLang(code)
                    if (isPlaying) {
                      stopAudio()
                      playAudio(selectedTopic, code)
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    activeLang === code
                      ? 'bg-[#183f32] text-[#dff47d] shadow-sm'
                      : 'text-[#485d51] hover:bg-[#edf2e6]'
                  }`}
                >
                  {LANG_NAMES[code]?.native || code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sound wave visualizer / Player Bar */}
          <div className="rounded-2xl bg-[#183f32] p-5 text-white shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#dff47d]">
                  {selectedTopic === 'general' ? 'Core Segregation Rules' : `Guide: ${selectedTopic}`}
                </div>
                <div className="mt-1 text-sm font-bold text-white/90">
                  {isPlaying ? 'Speaking now in ' + LANG_NAMES[activeLang]?.native : 'Ready to listen'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isPlaying && (
                  <div className="flex items-center gap-1 h-6 px-2">
                    <span className="w-1 bg-[#dff47d] rounded-full animate-bounce [animation-delay:-0.3s] h-4" />
                    <span className="w-1 bg-[#dff47d] rounded-full animate-bounce [animation-delay:-0.15s] h-6" />
                    <span className="w-1 bg-[#dff47d] rounded-full animate-bounce h-3" />
                    <span className="w-1 bg-[#dff47d] rounded-full animate-bounce [animation-delay:-0.2s] h-5" />
                  </div>
                )}
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-2 rounded-xl bg-[#dff47d] px-4 py-2.5 text-xs font-extrabold text-[#173f32] transition hover:bg-[#edffa6] shadow-sm"
                >
                  {isPlaying ? (
                    <>
                      <Square size={14} fill="currentColor" /> Stop Audio
                    </>
                  ) : (
                    <>
                      <Play size={14} fill="currentColor" /> Play Audio
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Subtitle Card */}
            <div className="mt-4 rounded-xl bg-white/10 p-3.5 border border-white/15">
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/95 italic">
                “{currentScript}”
              </p>
            </div>
          </div>

          {!speechSupported && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fff2d6] border border-[#ecd299] text-xs font-semibold text-[#8a5d1b]">
              <VolumeX size={16} /> Device speech synthesis is muted or unsupported. You can read the transcripts above.
            </div>
          )}

          {/* Category Topics Picker */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#63756a] mb-2.5">
              Choose a Stream to Hear Guidance
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectTopic('general')}
                className={`p-3 rounded-xl border text-left transition ${
                  selectedTopic === 'general'
                    ? 'border-[#183f32] bg-[#e6efd8] shadow-xs'
                    : 'border-[#dce1d6] bg-white hover:border-[#b8c6b0]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#183f32]">
                  <Sparkles size={14} className="text-[#658838]" /> General Overview
                </div>
                <div className="text-[10px] text-[#6b7b72] mt-0.5 font-medium">Wet vs Dry golden rules</div>
              </button>

              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectTopic(c.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedTopic === c.id
                      ? 'border-[#183f32] bg-[#e6efd8] shadow-xs'
                      : 'border-[#dce1d6] bg-white hover:border-[#b8c6b0]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#183f32]">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate">{c.name[activeLang] || c.name.en}</span>
                  </div>
                  <div className="text-[10px] text-[#6b7b72] mt-0.5 truncate font-medium">
                    {c.examples[activeLang] || c.examples.en}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#e2e6dc] bg-[#f0f4ea] px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-[#5c6e63]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#497330]" /> Clear guidance reduces contamination by 40%
          </span>
          <button
            onClick={() => {
              stopAudio()
              onClose()
            }}
            className="rounded-lg border border-[#cfd6c7] bg-white px-4 py-1.5 font-extrabold text-[#2a4537] hover:bg-[#e7eee0]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
