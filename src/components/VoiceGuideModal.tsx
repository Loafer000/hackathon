import React, { useState, useEffect, useRef } from 'react'
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

export const VOICE_SCRIPTS: Record<Lang, Record<string, string>> = {
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
      'वेस्ट टू वर्थ में आपका स्वागत है। मुख्य नियम: गीला रसोई का कचरा और सूखा कचरा हमेशा अलग रखें। प्लास्टिक और कांच की बोतलों को खाली करके धोकर सुखाएँ। बैटरी और सैनिटरी कचरे को कभी सूखे कचरे में न मिलाएँ।',
    organic:
      'गीला कचरा: फलों के छिलके, बचा हुआ खाना, चाय की पत्ती और सूखे पत्ते। अतिरिक्त तरी निकाल दें। कूड़ेदान में प्लास्टिक की थैली न लगाएँ।',
    plastic:
      'प्लास्टिक कचरा: दूध की थैलियाँ, पीने की बोतलें, डिब्बे और साफ पन्नी। दूध की थैली को पूरा काटकर पानी से धोएँ और सुखाकर नीले डिब्बे में रखें।',
    paper:
      'कागज़ व गत्ता: डिब्बे और अखबारों को चपटा करें। इन्हें सूखा रखें। तेल या खाने से सने पिज़्ज़ा बॉक्स को गीले कचरे में ही डालें।',
    metal:
      'धातु का कचरा: कोल्ड ड्रिंक के डिब्बे, टिन और पुराने बर्तन। खाना धोकर निकालें। हो सके तो एल्युमिनियम कैन दबा दें।',
    glass:
      'कांच: बोतलें और कांच के जार। इन्हें तोड़ें नहीं। टूटे कांच को अखबार में अच्छी तरह लपेटकर ऊपर कांच लिखें ताकि कर्मचारी को चोट न लगे।',
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
      'কাচের বোতল: কাচ ভাঙবেন না। ভাঙা কাচ পুরু খবরের কাগজে মুড়ে উপরে স্পষ্ট করে কাচ লিখুন।',
    ewaste:
      'ই-বর্জ্য: মোবাইল, চার্জার, তার ও ভাঙা বৈদ্যুতিক সরঞ্জাম। পোড়াবেন না বা ভাঙবেন না।',
    hazardous:
      'বিপজ্জনক বর্জ্য: পুরনো ব্যাটারি, টিউবলাইট ও মেয়াদোত্তীর্ণ ওষুধ। আলাদা বন্ধ বাক্সে রাখুন।',
    sanitary:
      'স্যানিটারি বর্জ্য: ডায়াপার, প্যাড ও ব্যান্ডেজ। খবরের কাগজে শক্ত করে মুড়ে লাল রঙের ক্রস চিহ্ন দিন।',
  },
}

export function playVoiceScript(topic: string, language: Lang, onStart?: () => void, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
  const script = VOICE_SCRIPTS[language]?.[topic] || VOICE_SCRIPTS.en?.[topic] || ''
  if (!script) return

  const utterance = new SpeechSynthesisUtterance(script)
  utterance.rate = 0.95
  utterance.pitch = 1.0

  const langCodeMap: Record<Lang, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    bn: 'bn-IN',
  }
  utterance.lang = langCodeMap[language] || 'en-IN'

  const voices = window.speechSynthesis.getVoices()
  // Look for exact match, then language match, then Indic fallback
  let voice = voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(utterance.lang.toLowerCase()))
  if (!voice) {
    voice = voices.find((v) => v.lang.toLowerCase().startsWith(language))
  }
  // If Marathi/Bengali not installed in Windows TTS, fallback to Hindi or Indian English voice which pronounces cleanly
  if (!voice && (language === 'mr' || language === 'bn')) {
    voice = voices.find((v) => v.lang.toLowerCase().startsWith('hi') || v.lang.toLowerCase().includes('in'))
  }
  if (voice) utterance.voice = voice

  if (onStart) utterance.onstart = onStart
  if (onEnd) {
    utterance.onend = onEnd
    utterance.onerror = onEnd
  }

  window.speechSynthesis.speak(utterance)
}

export function VoiceGuideModal({ isOpen, onClose, initialCategory }: VoiceGuideModalProps) {
  const { lang, tr } = useT()
  const [selectedTopic, setSelectedTopic] = useState<string>(initialCategory || 'general')
  const [isPlaying, setIsPlaying] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)

  useEffect(() => {
    if (initialCategory) {
      setSelectedTopic(initialCategory)
    }
  }, [initialCategory])

  useEffect(() => {
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setSpeechSupported(false)
    }
    // Load voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
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

  function handlePlay(topic = selectedTopic) {
    playVoiceScript(
      topic,
      lang,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    )
  }

  function togglePlay() {
    if (isPlaying) {
      stopAudio()
    } else {
      handlePlay(selectedTopic)
    }
  }

  function handleSelectTopic(topicId: string) {
    setSelectedTopic(topicId)
    if (isPlaying) {
      stopAudio()
      handlePlay(topicId)
    }
  }

  if (!isOpen) return null

  const currentScript = VOICE_SCRIPTS[lang]?.[selectedTopic] || VOICE_SCRIPTS.en?.[selectedTopic] || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#fafbf7] border border-[#dce0d4] shadow-2xl overflow-hidden text-[#18392b]">
        {/* Header with Language Selector (Issue 4) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e6dc] bg-[#f0f4ea] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#183f32] text-[#dff47d] shadow-sm">
              <Mic size={20} />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#567635]">
                {tr('Source Segregation Manual')}
              </div>
              <h2 className="font-display text-xl text-[#183f32]">
                {tr('Listen in Local Language')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#d2d9cc]">
              {(['en', 'hi', 'mr', 'bn'] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    actions.updateSession({ lang: l })
                    if (isPlaying) stopAudio()
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                    lang === l
                      ? 'bg-[#183f32] text-[#dff47d] shadow-xs'
                      : 'text-[#486053] hover:bg-[#edf2e6]'
                  }`}
                >
                  {LANG_NAMES[l].native}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#d2d9cc] bg-white text-[#526359]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Audio Player Banner */}
          <div className="rounded-2xl border border-[#d2dfcb] bg-[#eef6e6] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className={`h-12 w-12 rounded-2xl flex items-center justify-center transition shadow-md ${
                  isPlaying
                    ? 'bg-[#ba3d20] text-white hover:bg-[#a43419]'
                    : 'bg-[#183f32] text-[#dff47d] hover:bg-[#112d23]'
                }`}
              >
                {isPlaying ? <Square size={18} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <div>
                <div className="text-xs font-extrabold text-[#183f32] flex items-center gap-1.5">
                  <Volume2 size={16} className={isPlaying ? 'animate-pulse text-[#2a5c1b]' : 'text-[#6b8275]'} />
                  <span>{isPlaying ? tr('Playing Audio Guide...') : tr('Play Audio Guide')}</span>
                </div>
                <div className="text-[11px] font-semibold text-[#546b5e] mt-0.5">
                  Language: <strong>{LANG_NAMES[lang].native}</strong> · Stream: <strong>{selectedTopic.toUpperCase()}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={togglePlay}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-xs ${
                isPlaying
                  ? 'bg-[#ffebe6] text-[#ba3d20] border border-[#f5c4b8]'
                  : 'bg-[#183f32] text-[#dff47d]'
              }`}
            >
              {isPlaying ? tr('Stop Audio') : tr('Play Audio Guide')}
            </button>
          </div>

          {/* Transcript Display Box */}
          <div className="p-4 rounded-xl border border-[#dce3d6] bg-white space-y-2">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#637a6d]">
              Audio Transcript ({LANG_NAMES[lang].native}):
            </div>
            <p className="text-sm font-semibold text-[#294234] leading-relaxed">
              "{currentScript}"
            </p>
          </div>

          {/* Topic Selectors */}
          <div>
            <label className="text-xs font-extrabold text-[#3a5245] block mb-2">
              Select Waste Category for Voice Instructions:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectTopic('general')}
                className={`p-2.5 rounded-xl border text-left text-xs font-extrabold transition flex items-center justify-between ${
                  selectedTopic === 'general'
                    ? 'border-[#183f32] bg-[#f0f6eb] text-[#183f32] ring-2 ring-[#70954b]'
                    : 'border-[#dce2d7] bg-white text-[#455c50] hover:bg-[#edf2e7]'
                }`}
              >
                <span>Golden Rules</span>
                <Sparkles size={14} className="text-[#597e3a]" />
              </button>

              {CATEGORIES.map((c) => {
                const isSelected = selectedTopic === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectTopic(c.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-extrabold transition flex items-center justify-between ${
                      isSelected
                        ? 'border-[#183f32] bg-[#f0f6eb] text-[#183f32] ring-2 ring-[#70954b]'
                        : 'border-[#dce2d7] bg-white text-[#455c50] hover:bg-[#edf2e7]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name[lang] || c.name.en}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e2e6dc] bg-[#f0f4ea] px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#667a6e]">
            Local voice instructions for low-literacy doorstep guidance
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#183f32] px-4 py-1.5 text-xs font-extrabold text-[#dff47d]"
          >
            {tr('Close')}
          </button>
        </div>
      </div>
    </div>
  )
}
