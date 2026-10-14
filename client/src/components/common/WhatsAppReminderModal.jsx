import { useState, useEffect } from 'react'
import { Send, Phone, X, MessageSquare, Copy, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'

const WhatsAppReminderModal = ({ isOpen, onClose, farmer, totalDue }) => {
  const { language: appLang, t } = useLanguage()
  const [phone, setPhone] = useState('')
  const [selectedLang, setSelectedLang] = useState('te')
  const [urgency, setUrgency] = useState('gentle') // 'gentle' | 'urgent'
  const [customMessage, setCustomMessage] = useState('')
  const [shopSettings, setShopSettings] = useState(null)

  const dueAmount = parseFloat(totalDue !== undefined ? totalDue : (parseFloat(farmer?.current_credit || 0) + parseFloat(farmer?.accrued_interest || 0))).toFixed(2)

  // Supported languages in WhatsApp reminder
  const reminderLanguages = [
    { code: 'te', name: 'తెలుగు', label: 'Telugu', flag: '🌾' },
    { code: 'hi', name: 'हिंदी', label: 'Hindi', flag: '🇮🇳' },
    { code: 'en', name: 'English', label: 'English', flag: '🌐' },
    { code: 'ta', name: 'தமிழ்', label: 'Tamil', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', label: 'Kannada', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', label: 'Marathi', flag: '🇮🇳' }
  ]

  useEffect(() => {
    if (farmer) {
      setPhone(farmer.phone || '')
    }
    // Set default reminder language matching app language if supported, default to 'te' if telugu region
    if (appLang && reminderLanguages.some(l => l.code === appLang)) {
      setSelectedLang(appLang)
    } else {
      setSelectedLang('te')
    }
    fetchShopSettings()
  }, [farmer, appLang])

  useEffect(() => {
    generateMessage(selectedLang, urgency)
  }, [selectedLang, urgency, shopSettings, farmer, dueAmount])

  const fetchShopSettings = async () => {
    try {
      const res = await api.get('/settings')
      setShopSettings(res.data || {})
    } catch {
      // Fallback
    }
  }

  const generateMessage = (lang, level) => {
    if (!farmer) return
    const shopName = shopSettings?.shop_name || 'Tijilesh Fertilizers & Agri Center'
    const upiPart = shopSettings?.upi_id ? `\n💳 Pay via UPI ID: ${shopSettings.upi_id}` : ''
    const shopPhone = shopSettings?.shop_phone ? `\n📞 Helpline: ${shopSettings.shop_phone}` : ''

    let msg = ''

    if (lang === 'te') {
      if (level === 'urgent') {
        msg = `⚠️ ముఖ్యమైన చెల్లింపు సమాచారం\n\nప్రియమైన ${farmer.name} గారు,\n${shopName} వద్ద మీ వ్యవసాయ ఖాతా బాకీ బిల్లు ₹${dueAmount} ఇంకా పెండింగ్‌లో ఉంది.\n\nవచ్చే పంట సీజన్‌లో ఎరువులు మరియు విత్తనాల సదుపాయం నిరంతరాయంగా కొనసాగడానికి దయచేసి బాకీని వెంటనే చెల్లించవలసిందిగా మనవి.${upiPart}${shopPhone}\n\nధన్యవాదాలు.`
      } else {
        msg = `నమస్కారం ${farmer.name} గారు, 🙏\n\nఇది ${shopName} నుండి చిన్న చెల్లింపు రిమైండర్. మీ ఎరువులు మరియు విత్తనాల ఖాతాలో మొత్తం బాకీ బిల్లు ₹${dueAmount} ఉంది.\n\nదయచేసి మీ వీలును బట్టి త్వరగా చెల్లించవలసిందిగా కోరుతున్నాము.${upiPart}${shopPhone}\n\nధన్యవాదాలు మరియు శుభ వ్యవసాయం! 🌱`
      }
    } else if (lang === 'hi') {
      if (level === 'urgent') {
        msg = `⚠️ आवश्यक भुगतान सूचना\n\nप्रिय ${farmer.name} जी,\n${shopName} पर आपके कृषि खाते का बकाया बिल ₹${dueAmount} लंबित है।\n\nकृपया आगामी सीजन की खाद/बीज आपूर्ति एवं क्रेडिट जारी रखने हेतु जल्द भुगतान करें।${upiPart}${shopPhone}\n\nधन्यवाद।`
      } else {
        msg = `नमस्ते ${farmer.name} जी, 🙏\n\nयह ${shopName} की तरफ से एक विनम्र अनुस्मारक है। आपके खाद एवं बीज खाते का कुल बकाया बिल ₹${dueAmount} है।\n\nकृपया सुविधानुसार जल्द से जल्द भुगतान करने का कष्ट करें।${upiPart}${shopPhone}\n\nधन्यवाद एवं शुभ कृषि! 🌱`
      }
    } else if (lang === 'ta') {
      if (level === 'urgent') {
        msg = `⚠️ முக்கியமான நிலுவை அறிவிப்பு\n\nஅன்புள்ள ${farmer.name} அவர்களே,\n${shopName} கடையில் உங்கள் விவசாய கணக்கு நிலுவை ₹${dueAmount} நீண்ட நாட்களாக நிலுவையில் உள்ளது.\n\nஅடுத்த பருவத்திற்கான உரம் மற்றும் கடன் தொடர தயவுசெய்து உடனே தொகையை செலுத்தவும்.${upiPart}${shopPhone}\n\nநன்றி.`
      } else {
        msg = `வணக்கம் ${farmer.name} அவர்களே, 🙏\n\nஇது ${shopName} நிறுவனத்தின் அன்பான நிலுவைத் தொகை நினைவூட்டல். உங்கள் உரம் மற்றும் விதை கணக்கில் நிலுவை ₹${dueAmount} உள்ளது.\n\nதயவுசெய்து உங்கள் வசதிக்கேற்ப நிலுவையை விரைவில் செலுத்துமாறு கேட்டுக்கொள்கிறோம்.${upiPart}${shopPhone}\n\nநன்றி & நல்விவசாயம்! 🌱`
      }
    } else if (lang === 'kn') {
      if (level === 'urgent') {
        msg = `⚠️ ಮುಖ್ಯ ಬಾಕಿ ಪಾವತಿ ಸೂಚನೆ\n\nಆತ್ಮೀಯ ${farmer.name} ಅವರೇ,\n${shopName} ನಲ್ಲಿ ನಿಮ್ಮ ಕೃಷಿ ಖಾತೆಯ ಬಾಕಿ ಬಿಲ್ ₹${dueAmount} ಇನ್ನೂ ಬಾಕಿ ಉಳಿದಿದೆ.\n\nಮುಂದಿನ ಕೃಷಿ ಸೀಸನ್‌ನಲ್ಲಿ ಸೌಲಭ್ಯ ನಿರಂತರವಾಗಿರಲು ದಯವಿಟ್ಟು ಬಾಕಿಯನ್ನು ಶೀಘ್ರವೇ ಪಾವತಿಸಿ.${upiPart}${shopPhone}\n\nಧನ್ಯವಾದಗಳು.`
      } else {
        msg = `ನಮಸ್ಕಾರ ${farmer.name} ಅವರೇ, 🙏\n\nಇದು ${shopName} ವತಿಯಿಂದ ಸೌಮ್ಯ ಪಾವತಿ ಜ್ಞಾಪನೆ. ನಿಮ್ಮ ರಸಗೊಬ್ಬರ ಮತ್ತು ಬೀಜಗಳ ಖಾತೆಯಲ್ಲಿ ಒಟ್ಟು ಬಾಕಿ ₹${dueAmount} ಇದೆ.\n\nದಯವಿಟ್ಟು ನಿಮ್ಮ ಅನುಕೂಲಕ್ಕೆ ತಕ್ಕಂತೆ ಶೀಘ್ರವೇ ಪಾವತಿಸಲು ವಿನಂತಿ.${upiPart}${shopPhone}\n\nಧನ್ಯವಾದಗಳು & ಹರ್ಷದ ಕೃಷಿ! 🌱`
      }
    } else if (lang === 'mr') {
      if (level === 'urgent') {
        msg = `⚠️ महत्त्वाची बाकी देयक सूचना\n\nप्रिय ${farmer.name} जी,\n${shopName} कडे आपल्या कृषी खात्याचे बाकी बिल ₹${dueAmount} प्रलंबित आहे.\n\nपुढील हंगामात खत आणि पतपुरवठा अखंड सुरू ठेवण्यासाठी कृपया तातडीने देयक पूर्ण करावे.${upiPart}${shopPhone}\n\nधन्यवाद.`
      } else {
        msg = `नमस्कार ${farmer.name} जी, 🙏\n\nहे ${shopName} कडून एक नम्र देयक स्मरणपत्र आहे. आपल्या खते व बियाणे खात्यावरील एकूण बाकी बिल ₹${dueAmount} आहे.\n\nकृपया आपल्या सोयीनुसार लवकरात लवकर रक्कम भरावी.${upiPart}${shopPhone}\n\nधन्यवाद व समृद्ध शेती! 🌱`
      }
    } else {
      // English
      if (level === 'urgent') {
        msg = `⚠️ PAYMENT NOTICE\n\nDear ${farmer.name} ji,\nThis is to notify that your fertilizer account balance of ₹${dueAmount} at ${shopName} is currently pending clearance.\n\nPlease settle the dues at your earliest convenience to maintain continuous seasonal credit.${upiPart}${shopPhone}\n\nThank you.`
      } else {
        msg = `Hello ${farmer.name} ji, 🙏\n\nThis is a gentle payment reminder from ${shopName}. Your outstanding fertilizer bill balance is ₹${dueAmount}.\n\nKindly clear the pending payment at your convenience.${upiPart}${shopPhone}\n\nThank you & happy farming! 🌱`
      }
    }

    setCustomMessage(msg)
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage)
    toast.success(t('messageCopied') || 'Message copied to clipboard!')
  }

  const handleSendWhatsApp = () => {
    const rawPhone = phone.replace(/[^0-9]/g, '')
    if (!rawPhone || rawPhone.length < 10) {
      toast.error(t('enterValidPhone') || 'Please provide a valid 10-digit mobile number')
      return
    }

    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(customMessage)}`
    
    window.open(url, '_blank')
    toast.success(t('openingWhatsApp') || 'Opening WhatsApp with payment reminder')
    onClose()
  }

  if (!isOpen || !farmer) return null

  // Tone labels per language
  const toneLabels = {
    te: { gentle: '🌱 మర్యాదపూర్వక గుర్తు (Gentle)', urgent: '⚠️ ముఖ్య సమాచారం (Notice)' },
    hi: { gentle: '🌱 सौम्य अनुस्मारक (Gentle)', urgent: '⚠️ आवश्यक सूचना (Notice)' },
    en: { gentle: '🌱 Polite Reminder (Gentle)', urgent: '⚠️ Official Notice (Urgent)' },
    ta: { gentle: '🌱 அன்பான நினைவூட்டல் (Gentle)', urgent: '⚠️ நிலுவை அறிவிப்பு (Notice)' },
    kn: { gentle: '🌱 ಸೌಮ್ಯ ಜ್ಞಾಪನೆ (Gentle)', urgent: '⚠️ ಮುಖ್ಯ ಸೂಚನೆ (Notice)' },
    mr: { gentle: '🌱 नम्र स्मरणपत्र (Gentle)', urgent: '⚠️ महत्त्वाची सूचना (Notice)' }
  }

  const currentTone = toneLabels[selectedLang] || toneLabels.en

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl sm:rounded-[2rem] max-w-lg w-full max-h-[92vh] shadow-2xl flex flex-col relative border border-gray-100 overflow-hidden">
        {/* Sticky Header */}
        <div className="flex justify-between items-center px-5 sm:px-6 py-3.5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {t('whatsappReminderTitle') || 'WhatsApp Payment Reminder'}
              </h3>
              <p className="text-[11px] text-gray-500">
                {t('sendInstantReminder') || 'Send instant reminder to farmer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="px-5 sm:px-6 py-3.5 overflow-y-auto space-y-3.5 flex-1">
          {/* Farmer Summary Card */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                {t('farmers') || 'Farmer'}
              </p>
              <p className="font-bold text-gray-900 truncate text-sm">{farmer.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                {t('creditBalance') || 'Total Balance Due'}
              </p>
              <p className="font-black text-red-600 text-base">₹{dueAmount}</p>
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t('recipientMobile') || 'Recipient Mobile Number'}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Language Selector Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('messageStyleLanguage') || 'Reminder Language'}</span>
              </label>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">
                {reminderLanguages.find(l => l.code === selectedLang)?.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reminderLanguages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setSelectedLang(l.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    selectedLang === l.code
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selector */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUrgency('gentle')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                  urgency === 'gentle'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {currentTone.gentle}
              </button>
              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                  urgency === 'urgent'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {currentTone.urgent}
              </button>
            </div>
          </div>

          {/* Message Preview / Customizer */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                {t('previewEditMessage') || 'Preview & Edit Message'}
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{t('copyText') || 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              rows="4"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:border-emerald-500 outline-none font-sans leading-relaxed"
            />
          </div>
        </div>

        {/* Fixed Sticky Action Footer */}
        <div className="flex justify-between items-center px-5 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/90 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200/70 rounded-xl text-sm font-semibold transition-colors"
          >
            {t('cancel') || 'Cancel'}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition-all"
              title={t('copyText') || 'Copy Message Text'}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{t('copyText') || 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/30"
            >
              <Send className="w-4 h-4" />
              <span>{t('sendViaWhatsApp') || 'Send via WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppReminderModal
