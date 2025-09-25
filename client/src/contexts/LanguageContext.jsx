import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    shop: 'Shop',
    cart: 'Cart',
    orders: 'Orders',
    products: 'Products',
    sales: 'Sales',
    customers: 'Farmers',
    purchases: 'Suppliers',
    payments: 'Payments',
    accounting: 'Accounting',
    'stock-alerts': 'Stock Alerts',
    'mobile-app': 'Mobile App',
    analytics: 'Analytics',
    reports: 'Reports',
    logout: 'Logout',

    // Common
    search: 'Search',
    filter: 'Filter',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    noData: 'No data available',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',

    // Dashboard
    welcome: 'Welcome back',
    totalRevenue: 'Total Revenue',
    totalProducts: 'Total Products',
    totalCustomers: 'Total Farmers',
    avgOrderValue: 'Avg Order Value',
    lowStockAlerts: 'Low Stock Alerts',
    creditReminders: 'Credit Reminders',
    recentTransactions: 'Recent Transactions',

    // Shop
    browseProducts: 'Browse and purchase quality fertilizers',
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    continueShopping: 'Continue Shopping',

    // Cart
    shoppingCart: 'Shopping Cart',
    clearCart: 'Clear Cart',
    placeOrder: 'Place Order',
    orderSummary: 'Order Summary',
    shipping: 'Shipping',
    tax: 'Tax',
    total: 'Total',

    // Products
    fertilizerInventory: 'Fertilizer Inventory',
    manageProducts: 'Manage your agricultural products and supplies',
    addProduct: 'Add Product',
    productName: 'Product Name',
    type: 'Type',
    price: 'Price',
    stock: 'Stock',
    supplier: 'Supplier',
    description: 'Description',

    // Weather
    weatherInsights: 'Weather Insights',
    currentConditions: 'Current Conditions',
    soilMoisture: 'Soil Moisture',
    recommendation: 'Recommendation',
    dayForecast: '5-Day Forecast',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    farmingAdvice: 'Farming Advice',

    // Weather Widget
    yourFarmArea: 'Your Farm Area',
    partlyCloudy: 'Partly Cloudy',
    sunny: 'Sunny',
    rainy: 'Rainy',
    cloudy: 'Cloudy',
    goodConditionsFertilizer: 'Good conditions for fertilizer application. Soil moisture is optimal.',
    today: 'Today',
    tomorrow: 'Tomorrow',
    day3: 'Day 3',
    day4: 'Day 4',
    day5: 'Day 5',
    failedToLoadWeatherData: 'Failed to load weather data',

    // Farmer Tips
    farmerTips: 'Farmer Tips & Advice',
    soilTesting: 'Soil Testing Importance',
    waterConservation: 'Water Conservation',
    pestManagement: 'Integrated Pest Management',

    // Disease Detection
    cropDiseaseDetection: 'Crop Disease Detection',
    uploadOrCapture: 'Upload or Capture Plant Image',
    takePhoto: 'Take Photo',
    uploadImage: 'Upload Image',
    analyzeForDiseases: 'Analyze for Diseases',
    analyzingImage: 'Analyzing image with AI...',
    analysisResult: 'Analysis Result',
    confidence: 'Confidence',
    diseaseDescription: 'Description',
    recommendedTreatment: 'Recommended Treatment',
    preventionTips: 'Prevention Tips',
    aiAnalysisNote: 'This is an AI-powered analysis. For accurate diagnosis, consult with agricultural experts or local extension services.',

    // Disease Names and Descriptions
    leafBlight: 'Leaf Blight',
    healthyPlant: 'Healthy Plant',
    powderyMildew: 'Powdery Mildew',
    leafBlightDesc: 'Fungal infection causing brown spots on leaves',
    healthyPlantDesc: 'No visible signs of disease detected',
    powderyMildewDesc: 'White powdery coating on leaves and stems',
    leafBlightTreatment: 'Apply copper-based fungicide and improve air circulation',
    healthyPlantTreatment: 'Continue current care practices',
    powderyMildewTreatment: 'Apply sulfur-based fungicide and reduce humidity',
    leafBlightPreventive: 'Ensure proper spacing between plants and avoid overhead watering',
    healthyPlantPreventive: 'Maintain regular monitoring and proper nutrition',
    powderyMildewPreventive: 'Improve air circulation and avoid wetting foliage',

    // Community Forum
    communityForum: 'Community Forum',
    newPost: 'New Post',
    shareFarmingExperience: 'Share your farming experience or ask for advice...',
    post: 'Post',
    searchDiscussions: 'Search discussions...',
    forumAllTopics: 'All Topics',
    cropDiscussion: 'Crop Discussion',
    pestProblems: 'Pest Problems',
    equipment: 'Equipment',
    marketPrices: 'Market Prices',
    forumFarmingAdvice: 'Farming Advice',
    noDiscussionsFound: 'No discussions found',
    forumAdjustSearchFilter: 'Try adjusting your search or filter criteria.',

    // Fertilizer Calculator
    fertilizerCalculator: 'Fertilizer Calculator',
    selectCropType: 'Select Crop Type',
    chooseCrop: 'Choose a crop...',
    landArea: 'Land Area',
    enterArea: 'Enter area',
    unit: 'Unit',
    acres: 'Acres',
    hectares: 'Hectares',
    soilType: 'Soil Type',
    chooseSoilType: 'Choose soil type...',
    sandySoil: 'Sandy Soil',
    loamySoil: 'Loamy Soil',
    claySoil: 'Clay Soil',
    siltSoil: 'Silt Soil',
    currentSoilNPKLevels: 'Current Soil NPK Levels (kg/ha) - Optional',
    calculateFertilizerRequirements: 'Calculate Fertilizer Requirements',
    fertilizerRecommendations: 'Fertilizer Recommendations',
    area: 'Area',
    requiredNPK: 'Required NPK',
    recommendedFertilizers: 'Recommended Fertilizers',
    bags: 'bags',
    calculateAgain: 'Calculate Again',
    calculatorNote: '💡 These recommendations are estimates. Soil testing and local agricultural expert advice is recommended for precise requirements.',

    // Education Hub
    farmerEducationHub: 'Farmer Education Hub',
    searchEducationalContent: 'Search educational content...',
    educationAllTopics: 'All Topics',
    soilManagement: 'Soil Management',
    irrigation: 'Irrigation',
    pestControl: 'Pest Control',
    organicFarming: 'Organic Farming',
    agriTech: 'Agri-Tech',
    farmBusiness: 'Farm Business',
    videos: 'Videos',
    articles: 'Articles',
    noContentFound: 'No content found',
    educationAdjustSearchFilter: 'Try adjusting your search or filter criteria.',

    // Language
    selectLanguage: 'Select Language',
    english: 'English',
    hindi: 'हिंदी',
    telugu: 'తెలుగు',
    tamil: 'தமிழ்',
    kannada: 'ಕನ್ನಡ',
    marathi: 'मराठी',
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    shop: 'दुकान',
    cart: 'कार्ट',
    orders: 'ऑर्डर',
    products: 'उत्पाद',
    sales: 'बिक्री',
    customers: 'किसान',
    purchases: 'आपूर्तिकर्ता',
    payments: 'भुगतान',
    accounting: 'लेखांकन',
    'stock-alerts': 'स्टॉक अलर्ट',
    'mobile-app': 'मोबाइल ऐप',
    analytics: 'विश्लेषण',
    reports: 'रिपोर्ट',
    logout: 'लॉगआउट',

    // Common
    search: 'खोजें',
    filter: 'फिल्टर',
    add: 'जोड़ें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    loading: 'लोड हो रहा है...',
    noData: 'कोई डेटा उपलब्ध नहीं',
    confirm: 'पुष्टि करें',
    yes: 'हाँ',
    no: 'नहीं',

    // Dashboard
    welcome: 'वापसी पर स्वागत है',
    totalRevenue: 'कुल राजस्व',
    totalProducts: 'कुल उत्पाद',
    totalCustomers: 'कुल किसान',
    avgOrderValue: 'औसत ऑर्डर मूल्य',
    lowStockAlerts: 'कम स्टॉक अलर्ट',
    creditReminders: 'क्रेडिट रिमाइंडर',
    recentTransactions: 'हाल की लेनदेन',

    // Shop
    browseProducts: 'गुणवत्तापूर्ण उर्वरकों को ब्राउज़ और खरीदें',
    addToCart: 'कार्ट में जोड़ें',
    outOfStock: 'स्टॉक ख़त्म',
    continueShopping: 'खरीदारी जारी रखें',

    // Cart
    shoppingCart: 'शॉपिंग कार्ट',
    clearCart: 'कार्ट खाली करें',
    placeOrder: 'ऑर्डर दें',
    orderSummary: 'ऑर्डर सारांश',
    shipping: 'शिपिंग',
    tax: 'कर',
    total: 'कुल',

    // Products
    fertilizerInventory: 'उर्वरक इन्वेंटरी',
    manageProducts: 'अपने कृषि उत्पादों और आपूर्ति का प्रबंधन करें',
    addProduct: 'उत्पाद जोड़ें',
    productName: 'उत्पाद का नाम',
    type: 'प्रकार',
    price: 'मूल्य',
    stock: 'स्टॉक',
    supplier: 'आपूर्तिकर्ता',
    description: 'विवरण',

    // Weather
    weatherInsights: 'मौसम अंतर्दृष्टि',
    currentConditions: 'वर्तमान स्थितियाँ',
    soilMoisture: 'मिट्टी की नमी',
    recommendation: 'सिफारिश',
    dayForecast: '5-दिन का पूर्वानुमान',
    humidity: 'नमी',
    windSpeed: 'हवा की गति',
    farmingAdvice: 'खेती की सलाह',

    // Weather Widget
    yourFarmArea: 'आपका खेत क्षेत्र',
    partlyCloudy: 'आंशिक बादल',
    sunny: 'धूप',
    rainy: 'बारिश',
    cloudy: 'बादल',
    goodConditionsFertilizer: 'उर्वरक लगाने के लिए अच्छी स्थितियां। मिट्टी की नमी इष्टतम है।',
    today: 'आज',
    tomorrow: 'कल',
    day3: 'दिन 3',
    day4: 'दिन 4',
    day5: 'दिन 5',
    failedToLoadWeatherData: 'मौसम डेटा लोड करने में विफल',

    // Farmer Tips
    farmerTips: 'किसान टिप्स और सलाह',
    soilTesting: 'मिट्टी परीक्षण की महत्व',
    waterConservation: 'जल संरक्षण',
    pestManagement: 'एकीकृत कीट प्रबंधन',

    // Disease Names and Descriptions
    leafBlight: 'पत्ती का झुलसा',
    healthyPlant: 'स्वस्थ पौधा',
    powderyMildew: 'पाउडरी मिल्ड्यू',
    leafBlightDesc: 'पत्तियों पर भूरे धब्बे पैदा करने वाला फंगल संक्रमण',
    healthyPlantDesc: 'कोई रोग के लक्षण नहीं दिखाई दिए',
    powderyMildewDesc: 'पत्तियों और तनों पर सफेद पाउडरी की परत',
    leafBlightTreatment: 'कॉपर-आधारित फफूंदनाशक लगाएं और हवा के संचार में सुधार करें',
    healthyPlantTreatment: 'वर्तमान देखभाल प्रथाओं को जारी रखें',
    powderyMildewTreatment: 'सल्फर-आधारित फफूंदनाशक लगाएं और नमी कम करें',
    leafBlightPreventive: 'पौधों के बीच उचित दूरी सुनिश्चित करें और ऊपर से पानी देने से बचें',
    healthyPlantPreventive: 'नियमित निगरानी और उचित पोषण बनाए रखें',
    powderyMildewPreventive: 'हवा के संचार में सुधार करें और पत्तियों को गीला करने से बचें',

    // Fertilizer Calculator
    fertilizerCalculator: 'उर्वरक कैलकुलेटर',
    selectCropType: 'फसल प्रकार चुनें',
    chooseCrop: 'एक फसल चुनें...',
    landArea: 'भूमि क्षेत्र',
    enterArea: 'क्षेत्र दर्ज करें',
    unit: 'इकाई',
    acres: 'एकड़',
    hectares: 'हेक्टेयर',
    soilType: 'मिट्टी का प्रकार',
    chooseSoilType: 'मिट्टी का प्रकार चुनें...',
    sandySoil: 'रेतीली मिट्टी',
    loamySoil: 'दोमट मिट्टी',
    claySoil: 'चिकनी मिट्टी',
    siltSoil: 'गाद मिट्टी',
    currentSoilNPKLevels: 'वर्तमान मिट्टी NPK स्तर (kg/ha) - वैकल्पिक',
    calculateFertilizerRequirements: 'उर्वरक आवश्यकताएं गणना करें',
    fertilizerRecommendations: 'उर्वरक सिफारिशें',
    area: 'क्षेत्र',
    requiredNPK: 'आवश्यक NPK',
    recommendedFertilizers: 'अनुशंसित उर्वरक',
    bags: 'बोरे',
    calculateAgain: 'फिर से गणना करें',
    calculatorNote: '💡 ये सिफारिशें अनुमान हैं। सटीक आवश्यकताओं के लिए मिट्टी परीक्षण और स्थानीय कृषि विशेषज्ञ की सलाह की सिफारिश की जाती है।',

    // Education Hub
    farmerEducationHub: 'किसान शिक्षा केंद्र',
    searchEducationalContent: 'शैक्षिक सामग्री खोजें...',
    educationAllTopics: 'सभी विषय',
    soilManagement: 'मिट्टी प्रबंधन',
    irrigation: 'सिंचाई',
    pestControl: 'कीट नियंत्रण',
    organicFarming: 'जैविक खेती',
    agriTech: 'कृषि-टेक',
    farmBusiness: 'खेती व्यवसाय',
    videos: 'वीडियो',
    articles: 'लेख',
    noContentFound: 'कोई सामग्री नहीं मिली',
    educationAdjustSearchFilter: 'अपनी खोज या फ़िल्टर मानदंड समायोजित करने का प्रयास करें।',

    // Community Forum
    communityForum: 'सामुदायिक मंच',
    newPost: 'नई पोस्ट',
    shareFarmingExperience: 'अपना कृषि अनुभव साझा करें या सलाह मांगें...',
    post: 'पोस्ट करें',
    searchDiscussions: 'चर्चाओं में खोजें...',
    forumAllTopics: 'सभी विषय',
    cropDiscussion: 'फसल चर्चा',
    pestProblems: 'कीट समस्याएं',
    equipment: 'उपकरण',
    marketPrices: 'बाजार मूल्य',
    forumFarmingAdvice: 'कृषि सलाह',
    noDiscussionsFound: 'कोई चर्चा नहीं मिली',
    forumAdjustSearchFilter: 'अपनी खोज या फ़िल्टर मानदंड समायोजित करने का प्रयास करें।',

    // Language
    selectLanguage: 'भाषा चुनें',
    english: 'English',
    hindi: 'हिंदी',
    telugu: 'తెలుగు',
    tamil: 'தமிழ்',
    kannada: 'ಕನ್ನಡ',
    marathi: 'मराठी',
  },
  te: {
    // Telugu translations would go here
    dashboard: 'డ్యాష్‌బోర్డ్',
    shop: 'షాప్',
    cart: 'కార్ట్',
    orders: 'ఆర్డర్‌లు',
    products: 'ఉత్పత్తులు',
    sales: 'అమ్మకాలు',
    customers: 'రైతులు',
    purchases: 'సప్లైయర్‌లు',
    payments: 'చెల్లింపులు',
    accounting: 'లెక్కింగ్',
    'stock-alerts': 'స్టాక్ అలర్ట్‌లు',
    'mobile-app': 'మొబైల్ యాప్',
    analytics: 'విశ్లేషణ',
    reports: 'రిపోర్ట్‌లు',
    logout: 'లాగ్‌అవుట్',

    welcome: 'తిరిగి స్వాగతం',
    totalRevenue: 'మొత్తం ఆదాయం',
    totalProducts: 'మొత్తం ఉత్పత్తులు',
    totalCustomers: 'మొత్తం రైతులు',
    avgOrderValue: 'సగటు ఆర్డర్ విలువ',
    browseProducts: 'నాణ్యమైన ఎరువులను బ్రౌజ్ చేసి కొనండి',
    addToCart: 'కార్ట్‌కు జోడించు',
    outOfStock: 'స్టాక్ లేదు',
    continueShopping: 'షాపింగ్ కొనసాగించు',

    shoppingCart: 'షాపింగ్ కార్ట్',
    clearCart: 'కార్ట్ ఖాళీ చేయి',
    placeOrder: 'ఆర్డర్ చేయి',
    orderSummary: 'ఆర్డర్ సారాంశం',
    shipping: 'షిప్పింగ్',
    tax: 'పన్ను',
    total: 'మొత్తం',

    fertilizerInventory: 'ఎరువుల ఇన్వెంటరీ',
    manageProducts: 'మీ వ్యవసాయ ఉత్పత్తులు మరియు సరఫరాలను నిర్వహించండి',
    addProduct: 'ఉత్పత్తి జోడించు',
    productName: 'ఉత్పత్తి పేరు',
    type: 'రకం',
    price: 'ధర',
    stock: 'స్టాక్',
    supplier: 'సప్లైయర్',
    description: 'వివరణ',

    weatherInsights: 'వాతావరణ అంతర్దృష్టులు',
    currentConditions: 'ప్రస్తుత పరిస్థితులు',
    soilMoisture: 'మట్టి తేమ',
    recommendation: 'సిఫార్సు',
    dayForecast: '5-రోజుల పూర్వాభిప్రాయం',
    humidity: 'తేమ',
    windSpeed: 'గాలి వేగం',
    farmingAdvice: 'వ్యవసాయ సలహా',

    // Weather Widget
    yourFarmArea: 'మీ పొలం ప్రాంతం',
    partlyCloudy: 'పాక్షిక మేఘాలు',
    sunny: 'వెలుతురు',
    rainy: 'వర్షం',
    cloudy: 'మేఘాలు',
    goodConditionsFertilizer: 'ఎరువులను వర్తించడానికి మంచి పరిస్థితులు. మట్టి తేమ అనుకూలంగా ఉంది.',
    today: 'ఈరోజు',
    tomorrow: 'రేపు',
    day3: 'రోజు 3',
    day4: 'రోజు 4',
    day5: 'రోజు 5',
    failedToLoadWeatherData: 'వాతావరణ డేటాను లోడ్ చేయడంలో విఫలమైంది',

    farmerTips: 'రైతు సలహాలు మరియు చిట్కాలు',
    soilTesting: 'మట్టి పరీక్ష ముఖ్యత్వం',
    waterConservation: 'నీటి సంరక్షణ',
    pestManagement: 'సమగ్ర పురుగుల నిర్వహణ',

    // Disease Names and Descriptions
    leafBlight: 'ఆకు బ్లైట్',
    healthyPlant: 'ఆరోగ్యకరమైన మొక్క',
    powderyMildew: 'పౌడరీ మిల్డ్యూ',
    leafBlightDesc: 'ఆకులపై బ్రౌన్ స్పాట్‌లను కలిగించే ఫంగల్ ఇన్ఫెక్షన్',
    healthyPlantDesc: 'వ్యాధి లక్షణాలు కనిపించలేదు',
    powderyMildewDesc: 'ఆకుల మరియు కాండాలపై తెలుపు పౌడరీ కోటింగ్',
    leafBlightTreatment: 'కాపర్-ఆధారిత ఫంగిసైడ్ వర్తించండి మరియు గాలి ప్రవాహాన్ని మెరుగుపరచండి',
    healthyPlantTreatment: 'ప్రస్తుత సంరక్షణ పద్ధతులను కొనసాగించండి',
    powderyMildewTreatment: 'సల్ఫర్-ఆధారిత ఫంగిసైడ్ వర్తించండి మరియు తేమను తగ్గించండి',
    leafBlightPreventive: 'మొక్కల మధ్య సరైన దూరం నిర్ధారించండి మరియు పై నుండి నీరు పోసేలను నివారించండి',
    healthyPlantPreventive: 'సాధారణ పర్యవేక్షణ మరియు సరైన పోషణను నిర్వహించండి',
    powderyMildewPreventive: 'గాలి ప్రవాహాన్ని మెరుగుపరచండి మరియు ఆకులను తడిపించేలను నివారించండి',

    // Fertilizer Calculator
    fertilizerCalculator: 'ఎరువుల క్యాల్క్యులేటర్',
    selectCropType: 'పంట రకం ఎంచుకోండి',
    chooseCrop: 'పంటను ఎంచుకోండి...',
    landArea: 'భూభాగం',
    enterArea: 'ప్రాంతాన్ని నమోదు చేయండి',
    unit: 'యూనిట్',
    acres: 'ఎకరాలు',
    hectares: 'హెక్టార్లు',
    soilType: 'మట్టి రకం',
    chooseSoilType: 'మట్టి రకం ఎంచుకోండి...',
    sandySoil: 'ఇసుక మట్టి',
    loamySoil: 'లోమీ మట్టి',
    claySoil: 'మట్టి మట్టి',
    siltSoil: 'సిల్ట్ మట్టి',
    currentSoilNPKLevels: 'ప్రస్తుత మట్టి NPK స్థాయిలు (kg/ha) - ఐచ్ఛికం',
    calculateFertilizerRequirements: 'ఎరువుల అవసరాలను లెక్కించండి',
    fertilizerRecommendations: 'ఎరువుల సిఫార్సులు',
    area: 'ప్రాంతం',
    requiredNPK: 'అవసరమైన NPK',
    recommendedFertilizers: 'సిఫార్సు చేయబడిన ఎరువులు',
    bags: 'పొట్లు',
    calculateAgain: 'మళ్లీ లెక్కించు',
    calculatorNote: '💡 ఈ సిఫార్సులు అంచనాలు. ఖచ్చితమైన అవసరాల కోసం మట్టి పరీక్ష మరియు స్థానిక వ్యవసాయ నిపుణుల సలహా సిఫార్సు చేయబడింది.',

    // Education Hub
    farmerEducationHub: 'రైతు విద్యా కేంద్రం',
    searchEducationalContent: 'విద్యా సామగ్రిని వెతకండి...',
    educationAllTopics: 'అన్ని అంశాలు',
    soilManagement: 'మట్టి నిర్వహణ',
    irrigation: 'నీటిపారుదల',
    pestControl: 'పురుగుల నియంత్రణ',
    organicFarming: 'సేంద్రీయ వ్యవసాయం',
    agriTech: 'వ్యవసాయ-టెక్',
    farmBusiness: 'వ్యవసాయ వ్యాపారం',
    videos: 'వీడియోలు',
    articles: 'లేఖలు',
    noContentFound: 'సామగ్రి కనుగొనబడలేదు',
    educationAdjustSearchFilter: 'మీ శోధన లేదా ఫిల్టర్ ప్రమాణాలను సర్దుబాటు చేయడానికి ప్రయత్నించండి.',

    // Community Forum
    communityForum: 'సమాజ ఫోరమ్',
    newPost: 'కొత్త పోస్ట్',
    shareFarmingExperience: 'మీ వ్యవసాయ అనుభవాన్ని పంచుకోండి లేదా సలహా అడగండి...',
    post: 'పోస్ట్ చేయండి',
    searchDiscussions: 'చర్చలలో వెతకండి...',
    forumAllTopics: 'అన్ని అంశాలు',
    cropDiscussion: 'పంట చర్చ',
    pestProblems: 'పురుగుల సమస్యలు',
    equipment: 'పరికరాలు',
    marketPrices: 'మార్కెట్ ధరలు',
    forumFarmingAdvice: 'వ్యవసాయ సలహా',
    noDiscussionsFound: 'చర్చలు కనుగొనబడలేదు',
    forumAdjustSearchFilter: 'మీ శోధన లేదా ఫిల్టర్ ప్రమాణాలను సర్దుబాటు చేయడానికి ప్రయత్నించండి.',

    selectLanguage: 'భాష ఎంచుకోండి',
    english: 'English',
    hindi: 'हिंदी',
    telugu: 'తెలుగు',
    tamil: 'தமிழ்',
    kannada: 'ಕನ್ನಡ',
    marathi: 'मराठी',
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage)
    }
  }, [])

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage)
      localStorage.setItem('language', newLanguage)
    }
  }

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}