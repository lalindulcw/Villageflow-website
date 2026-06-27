const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Chatbot rate limiter 
const chatbotLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 
    max: 60,
    message: { success: false, reply: "පද්ධති කාර්යබහුලයි. කරුණාකර විනාඩි කිහිපයකින් නැවත උත්සාහ කරන්න. (Too many requests, please try again in 10 minutes.)" }
});

// Advanced Multi-language Responses with Real-World Answers
const responses = {
    si: {
        // Welcome
        welcome: "👋 **ආයුබෝවන්!** මම **VillageFlow AI සහායක** වෙමි.\n\n🏛️ **ශ්‍රී ලංකා රජයේ ඩිජිටල් සේවා පද්ධතිය** වෙත ඔබව සාදරයෙන් පිළිගනිමු.\n\n📌 **මට ඔබට උදව් කළ හැකි ක්‍රම:**\n✅ ගිණුම් ලියාපදිංචිය සහ පුරනය වීම\n✅ සහතික අයදුම්පත් (පදිංචි, චරිත, ආදායම්)\n✅ සහනාධර අයදුම්පත් (අස්වැසුම, සමෘද්ධි, වැඩිහිටි)\n✅ පත්වීම් වෙන්කරවා ගැනීම\n✅ ප්‍රොක්සි ලියාපදිංචිය (වැඩිහිටි සේවා)\n✅ අයදුම්පත් තත්වය පරීක්ෂා කිරීම\n✅ ග්‍රාම නිලධාරී සම්බන්ධතා තොරතුරු\n✅ ගෙවීම් සහ ගාස්තු තොරතුරු\n\n💬 **ඔබට ඕනෑම ප්‍රශ්නයක් අසන්න පුළුවන්!**",
        
        // Registration
        register: "📝 **ලියාපදිංචි වීමේ සම්පූර්ණ මාර්ගෝපදේශය:**\n\n🔹 **පියවර 1:** 'Register' බොත්තම ක්ලික් කරන්න\n🔹 **පියවර 2:** පහත තොරතුරු නිවැරදිව පුරවන්න:\n   • සම්පූර්ණ නම (උදා: ජයසිංහ ඒ.එම්. සුනිල්)\n   • NIC අංකය (පැරණි: 912345678V, නව: 199012345678)\n   • ජංගම දුරකථන අංකය (උදා: 0712345678)\n   • වලංගු ඊමේල් ලිපිනය\n   • උපන් දිනය (YYYY-MM-DD)\n   • ශක්තිමත් මුරපදයක් (අකුරු 8+, අකුරු සහ ඉලක්කම්)\n🔹 **පියවර 3:** 'Register Account' ක්ලික් කරන්න\n🔹 **පියවර 4:** ලියාපදිංචියෙන් පසු ඔබගේ NIC එකෙන් පුරනය වන්න\n\n⚠️ **වැදගත්:** ලියාපදිංචිය සඳහා වයස අවුරුදු 18ට වැඩි විය යුතුය!\n✅ සාර්ථක ලියාපදිංචියෙන් පසු ඔබට සියලු ඩිජිටල් සේවාවන්ට ප්‍රවේශය ලැබේ.",
        
        // Login
        login: "🔐 **පුරනය වීමේ පියවර:**\n\n🔹 **පියවර 1:** 'Login' බොත්තම ක්ලික් කරන්න\n🔹 **පියවර 2:** ඔබගේ NIC අංකය ඇතුළත් කරන්න\n🔹 **පියවර 3:** ලියාපදිංචියේදී සාදාගත් මුරපදය ඇතුළත් කරන්න\n🔹 **පියවර 4:** පරිශීලක වර්ගය 'Citizen' ලෙස තෝරන්න\n🔹 **පියවර 5:** 'Secure Sign In' ක්ලික් කරන්න\n\n🔑 **මුරපදය අමතක වුවහොත්:**\n   • ඔබගේ ග්‍රාම නිලධාරී කාර්යාලය අමතන්න\n   • රජයේ තොරතුරු මධ්‍යස්ථානය 1900 අමතන්න\n   • ඔබගේ NIC එක රැගෙන ආසන්නතම GN කාර්යාලයට පැමිණෙන්න\n\n❌ **පුරනය වීමේ ගැටළු:**\n   • NIC අංකය නිවැරදිදැයි පරීක්ෂා කරන්න\n   • මුරපදයේ කේස් සෙන්සිටිව් බව මතක තබා ගන්න\n   • ඔබගේ ගිණුම සක්‍රියදැයි පරීක්ෂා කරන්න",
        
        // Proxy Registration
        proxy: "👴 **ප්‍රොක්සි ලියාපදිංචිය (වැඩිහිටි සේවා) - සම්පූර්ණ මග පෙන්වීම:**\n\n👤 **සුදුසුකම් නිර්ණායක:**\n   • වයස අවුරුදු 65 හෝ ඊට වැඩි\n   • නිවසේ රැකවරණය අවශ්‍ය පුද්ගලයින්\n   • ආබාධිත තත්වයන් ඇති අය\n   • තනිව ජීවත් වන වැඩිහිටියන්\n\n📋 **අවශ්‍ය ලේඛන:**\n   • වලංගු NIC පිටපත\n   • වයස සනාථ කරන ලේඛනය (උප්පැන්න සහතිකය)\n   • ලිපිනය සනාථ කරන ලේඛනයක්\n   • භාරකරුගේ NIC පිටපත\n   • පවුලේ සාමාජික සම්බන්ධතාවය සනාථ කරන ලේඛනය\n\n📝 **අයදුම් කිරීමේ පියවර:**\n   1. ඔබගේ ග්‍රාම නිලධාරී කාර්යාලයට පැමිණෙන්න\n   2. ප්‍රොක්සි අයදුම්පත ඉල්ලා ගන්න\n   3. සියලු තොරතුරු නිවැරදිව පුරවන්න\n   4. අවශ්‍ය සියලු ලේඛන අමුණන්න\n   5. කාර්යාල නිලධාරියාට භාර දෙන්න\n   6. ලියාපදිංචිය සම්පූර්ණ කිරීමට දින 5-7ක් ගතවේ\n\n💰 **ගාස්තු:** ලියාපදිංචිය සම්පූර්ණයෙන්ම නොමිලේ\n\n📞 **වැඩි විස්තර:** 1900 අමතන්න හෝ ඔබගේ GN කාර්යාලයට පැමිණෙන්න",
        
        // Certificates
        certificate: "📄 **සහතික අයදුම්පත් - සම්පූර්ණ මග පෙන්වීම:**\n\n📌 **සහතික වර්ග සහ ගාස්තු:**\n   🏠 **පදිංචි සහතිකය** - රු. 250/=\n      • ඔබගේ වත්මන් ලිපිනය තහවුරු කිරීමට\n      • බැංකු, රැකියා, අධ්‍යාපන අවශ්‍යතා සඳහා\n   \n   👤 **චරිත සහතිකය** - රු. 200/=\n      • රැකියා අයදුම්පත් සඳහා\n      • විදේශ ගමන් සඳහා\n      • අධ්‍යාපන ආයතන සඳහා\n   \n   💰 **ආදායම් සහතිකය** - රු. 300/=\n      • බැංකු ණය සඳහා\n      • සහනාධර සඳහා\n      • රජයේ ප්‍රතිලාභ සඳහා\n   \n   👶 **උප්පැන්න සහතික පිටපත** - රු. 150/=\n      • නැතිවූ උප්පැන්න සහතිකය වෙනුවට\n      • පාසල් ඇතුළත් වීම් සඳහා\n\n📝 **අයදුම් කිරීමේ පියවර:**\n   1. 'Certificates' පිටුවට යන්න\n   2. ඔබගේ NIC එක ස්කෑන් කරන්න (කැමරාව භාවිතා කරන්න)\n   3. අවශ්‍ය සහතික වර්ගය තෝරන්න\n   4. පහත ලේඛන උඩුගත කරන්න:\n      • NIC පිටපත\n      • විදුලි/ජල බිල්පත (මාස 3ක් ඇතුළත)\n   5. ඔන්ලයින් ගෙවීම සම්පූර්ණ කරන්න\n   6. අයදුම්පත ඉදිරිපත් කරන්න\n\n⏰ **සැකසීමේ කාලය:** දින 3-5\n✅ **අනුමත වූ පසු:** PDF සහතිකය බාගත කළ හැක\n📧 **දැනුම්දීම:** ඔබගේ ඊමේල් සහ පණිවුඩ වලට දැනුම්දීමක් ලැබේවි",
        
        // Welfare
        welfare: "🏠 **සහනාධර අයදුම්පත් - සම්පූර්ණ මග පෙන්වීම:**\n\n📌 **සහනාධර වර්ග:**\n\n**1. අස්වැසුම සහනාධරය**\n   ✅ **සුදුසුකම්:**\n      • මාසික පවුල් ආදායම රු. 20,000 ට අඩු\n      • රජයේ සේවකයෙකු නොවිය යුතුය\n      • වයස අවුරුදු 18-65 අතර\n   💰 **ප්‍රතිලාභ:** මාසික රු. 5,000 - 15,000\n\n**2. සමෘද්ධි සහනාධරය**\n   ✅ **සුදුසුකම්:**\n      • මාසික පවුල් ආදායම රු. 15,000 ට අඩු\n      • ඉඩම් රහිත පවුල්\n      • තනි මාපිය පවුල්\n   💰 **ප්‍රතිලාභ:** මාසික රු. 3,000 - 10,000\n\n**3. වැඩිහිටි දීමනාව**\n   ✅ **සුදුසුකම්:**\n      • වයස අවුරුදු 60 හෝ ඊට වැඩි\n      • විශ්‍රාම වැටුපක් නොමැති\n      • ආදායම් සීමාවක් නැත\n   💰 **ප්‍රතිලාභ:** මාසික රු. 2,000 - 5,000\n\n📝 **අයදුම් කිරීමේ පියවර:**\n   1. 'Welfare Apply' පිටුවට යන්න\n   2. ඔබගේ පූර්ණ නම, NIC, නිවාස අංකය ඇතුළත් කරන්න\n   3. සහනාධර වර්ගය තෝරන්න\n   4. නිවැරදි මාසික ආදායම ඇතුළත් කරන්න\n   5. ආදායම් සාක්ෂිය (පේස්ලිප්) උඩුගත කරන්න\n   6. බැංකු ගිණුම් තොරතුරු ඇතුළත් කරන්න\n   7. ඉදිරිපත් කර ග්‍රාම නිලධාරී අනුමැතිය එනතෙක් රැඳී සිටින්න\n\n⏰ **සැකසීමේ කාලය:** දින 7-14\n📞 **ප්‍රශ්න සඳහා:** ඔබගේ GN කාර්යාලය අමතන්න",
        
        // Appointment
        appointment: "📅 **පත්වීම් වෙන්කරවා ගැනීම - සම්පූර්ණ මග පෙන්වීම:**\n\n📌 **පත්වීම් වර්ග:**\n   🏠 පදිංචි සහතික අයදුම්පත්\n   👤 චරිත සහතික අයදුම්පත්\n   💰 ආදායම් සහතික අයදුම්පත්\n   🏥 සෞඛ්‍ය සහනාධර\n   📝 පොදු පරිපාලන කටයුතු\n\n📝 **වෙන්කරවා ගැනීමේ පියවර:**\n   1. 'Appointments' පිටුවට යන්න\n   2. කැලැන්ඩරයෙන් අපේක්ෂිත දිනය තෝරන්න (ඉදිරි දින 14ක් සඳහා)\n   3. පවතින වේලාවක් තෝරන්න (9:00 AM - 3:00 PM)\n   4. පත්වීමේ හේතුව සඳහන් කරන්න\n   5. ඔබගේ NIC අංකය ඇතුළත් කරන්න\n   6. ඉදිරිපත් කරන්න\n\n✅ **අනුමත වූ පසු:**\n   • ඔබගේ ඊමේල් එකට දැනුම්දීමක් ලැබේවි\n   • SMS පණිවුඩයක් ලැබේවි\n   • Dashboard එකේ තත්වය 'Approved' ලෙස වෙනස් වේ\n\n⏰ **සැකසීමේ කාලය:** පැය 24-48\n📍 **ස්ථානය:** ඔබගේ ග්‍රාම නිලධාරී කාර්යාලය\n\n📞 **වෙනස් කිරීම්/අවලංගු කිරීම්:** 1900 අමතන්න",
        
        // Status
        status: "📋 **අයදුම්පත් තත්වය පරීක්ෂා කිරීම:**\n\n🔍 **තත්වයන් පිළිබඳ පැහැදිලි කිරීම:**\n\n🟡 **Pending (රැඳී සිටිමින්)**\n   • ඔබගේ අයදුම්පත ග්‍රාම නිලධාරී වෙත යොමු කර ඇත\n   • සමාලෝචනය වෙමින් පවතී\n   • කිසිදු ක්‍රියාවක් අවශ්‍ය නොවේ\n\n🟢 **Approved (අනුමතයි)**\n   • ඔබගේ අයදුම්පත අනුමත කර ඇත\n   • 'Download PDF' බොත්තම සක්‍රිය වේ\n   • සහතිකය බාගත කර ගත හැක\n   • මුද්‍රණය කර ගත හැක\n\n🔴 **Rejected (ප්‍රතික්ෂේපයි)**\n   • අයදුම්පත ප්‍රතික්ෂේප කර ඇත\n   • හේතුව පැහැදිලිව දක්වා ඇත\n   • නැවත අයදුම් කළ හැක\n   • අවශ්‍ය නම් GN කාර්යාලය අමතන්න\n\n📌 **තත්වය පරීක්ෂා කරන ආකාරය:**\n   1. ඔබගේ Dashboard එකට යන්න\n   2. 'My Applications' කොටස බලන්න\n   3. එක් එක් අයදුම්පත අසල තත්වය දිස්වේ\n   4. විස්තර සඳහා 'View Details' ක්ලික් කරන්න\n\n📞 **සහාය සඳහා:** 1900 අමතන්න",
        
        // Documents
        documents: "📄 **අවශ්‍ය ලේඛන පිළිබඳ සම්පූර්ණ තොරතුරු:**\n\n📌 **සහතික සඳහා අවශ්‍ය ලේඛන:**\n   ✅ **අනිවාර්ය:**\n      • වලංගු NIC පිටපත (ඉදිරිපස සහ පිටුපස)\n      • වත්මන් ලිපිනය සනාථ කරන ලේඛනයක් (විදුලි/ජල බිල්පත - මාස 3ක් ඇතුළත)\n   \n   ✅ **පවුලේ සාමාජිකයෙකු සඳහා (අමතර):**\n      • ඔවුන්ගේ NIC පිටපත\n      • සම්බන්ධතාවය සනාථ කරන ලේඛනයක්\n\n📌 **සහනාධර සඳහා අවශ්‍ය ලේඛන:**\n   ✅ **අනිවාර්ය:**\n      • වලංගු NIC පිටපත\n      • මාසික ආදායම් සාක්ෂිය (පේස්ලිප් හෝ ආදායම් ප්‍රකාශය)\n      • නිවාස අංකය\n      • බැංකු ගිණුම් පොතේ පිටපත (පළමු පිටුව)\n   \n   ✅ **අතිරේක (අවශ්‍ය නම්):**\n      • විවාහ සහතිකය\n      • දික්කසාද නියෝගය\n      • දරුවන්ගේ උප්පැන්න සහතික\n\n📌 **ප්‍රොක්සි ලියාපදිංචිය සඳහා:**\n   ✅ **අවශ්‍ය ලේඛන:**\n      • අයදුම්කරුගේ NIC පිටපත\n      • භාරකරුගේ NIC පිටපත\n      • වයස සනාථ කරන ලේඛනය\n      • වෛද්‍ය සහතිකය (අවශ්‍ය නම්)\n\n📎 **ගොනු ආකෘති:** PDF, JPEG, PNG (උපරිම 5MB)\n⚠️ **සටහන:** සියලුම ලේඛන පැහැදිලිව පෙනෙන පරිදි විය යුතුය",
        
        // Fees
        fees: "💰 **සියලුම සේවා ගාස්තු පිළිබඳ සම්පූර්ණ තොරතුරු:**\n\n📌 **සහතික ගාස්තු:**\n   🏠 පදිංචි සහතිකය ................ රු. 250/=\n   👤 චරිත සහතිකය .................... රු. 200/=\n   💰 ආදායම් සහතිකය .................. රු. 300/=\n   👶 උප්පැන්න සහතික පිටපත ........... රු. 150/=\n\n📌 **සහනාධර ගාස්තු:**\n   🏠 අස්වැසුම ........................ නොමිලේ\n   🤝 සමෘද්ධි ......................... නොමිලේ\n   👴 වැඩිහිටි දීමනාව ................ නොමිලේ\n\n📌 **වෙනත් සේවා:**\n   📅 පත්වීම් ......................... නොමිලේ\n   👤 ප්‍රොක්සි ලියාපදිංචිය ........... නොමිලේ\n   🔍 තත්වය පරීක්ෂා කිරීම ............ නොමිලේ\n\n💳 **ගෙවීම් ක්‍රම:**\n   • ක්‍රෙඩිට්/ඩෙබිට් කාඩ් (Visa, Mastercard, Amex)\n   • බැංකු හුවමාරුව (සියලු ප්‍රධාන බැංකු)\n   • ජංගම ගෙවීම් (Dialog eZ Cash, mCash, Hutch)\n   • ග්‍රාම නිලධාරී කාර්යාලයෙන් මුදල් ගෙවීම\n\n👴 **විශේෂ සහන:**\n   • වයස අවුරුදු 65+ සහනාධර සඳහා ගාස්තු නැත\n   • ආබාධිත පුද්ගලයින්ට ගාස්තු සහන\n   • අඩු ආදායම්ලාභීන්ට ගාස්තු අඩු කිරීමේ හැකියාව\n\n💰 **ගෙවීම් තහවුරු කිරීම:**\n   • ගෙවීමෙන් පසු වහාම රිසිට්පතක් ලැබේවි\n   • ඊමේල් එකට පිටපතක් යයි\n   • Dashboard එකේ ගෙවීම් ඉතිහාසය බලාගත හැක\n\n⚠️ **සටහන:** ගාස්තු රජයේ ප්‍රතිපත්ති අනුව වෙනස් විය හැක",
        
        // Time
        time: "⏰ **සේවා සැකසීමේ කාලසීමාවන්:**\n\n📌 **සහතික අයදුම්පත්:**\n   • ඉදිරිපත් කිරීමේ සිට අනුමැතිය දක්වා: **දින 3-5**\n   • PDF නිකුත් කිරීම: අනුමැතියෙන් පසු වහාම\n   • තැපැල් යැවීම: දින 7-10 (අයදුම් කළහොත්)\n\n📌 **සහනාධර අයදුම්පත්:**\n   • ඉදිරිපත් කිරීමේ සිට අනුමැතිය දක්වා: **දින 7-14**\n   • ප්‍රතිලාභ ගෙවීම: අනුමැතියෙන් පසු මාසයක් ඇතුළත\n   • සමාලෝචනය: සති 2-4\n\n📌 **පත්වීම්:**\n   • ඉදිරිපත් කිරීමේ සිට අනුමැතිය දක්වා: **පැය 24-48**\n   • පත්වීම් කාලසීමාව: විනාඩි 15-30\n\n📌 **ප්‍රොක්සි ලියාපදිංචිය:**\n   • ඉදිරිපත් කිරීමේ සිට අනුමැතිය දක්වා: **දින 5-7**\n   • කාඩ්පත් නිකුත් කිරීම: දින 10-14\n\n⚠️ **සැලකිය යුතු කරුණු:**\n   • රජයේ නිවාඩු දිනවලදී කාලසීමාවන් දීර්ඝ විය හැක\n   • කාර්යබහුල කාලවලදී (ජනවාරි, දෙසැම්බර්) ප්‍රමාද විය හැක\n   • අසම්පූර්ණ ලේඛන නිසා ප්‍රමාද විය හැක\n\n✅ **තත්වය පරීක්ෂා කිරීම:**\n   • Dashboard එකේ 'My Applications' කොටස බලන්න\n   • ඔබගේ ඊමේල් එක පරීක්ෂා කරන්න\n   • SMS දැනුම්දීම් සක්‍රිය කරන්න",
        
        // Contact
        contact: "📞 **ග්‍රාම නිලධාරී සම්බන්ධතා තොරතුරු:**\n\n🏢 **කාර්යාල තොරතුරු:**\n   • **නම:** ග්‍රාම නිලධාරී කාර්යාලය\n   • **ලිපිනය:** කොටගම, බිබිල, ශ්‍රී ලංකාව\n   • **දුරකථන:** 1900 (රජයේ තොරතුරු මධ්‍යස්ථානය)\n   • **විද්‍යුත් තැපෑල:** villageflow6@gmail.com\n\n🕐 **විවෘත වේලාවන්:**\n   • සඳුදා - සිකුරාදා: 8:30 AM - 4:15 PM\n   • දිවා ආහාර වේලාව: 12:00 PM - 1:00 PM\n   • සෙනසුරාදා, ඉරිදා: වසා ඇත\n   • රජයේ නිවාඩු දින: වසා ඇත\n\n📌 **සම්බන්ධ වීමේ ක්‍රම:**\n   1. **දුරකථන ඇමතුමක්:** 1900 අමතන්න\n   2. **පුද්ගලික පැමිණීම:** ඔබගේ NIC රැගෙන කාර්යාලයට පැමිණෙන්න\n   3. **විද්‍යුත් තැපෑල:** villageflow6@gmail.com ට ලිපියක් යවන්න\n   4. **පැමිණිලි/යෝජනා:** පද්ධතිය තුළින් 'Complaints' භාවිතා කරන්න\n\n📝 **පැමිණෙන විට රැගෙන එන්න:**\n   • ඔබගේ මුල් NIC එක\n   • අදාළ ලේඛනවල පිටපත්\n   • පැමිණිලි/ඉල්ලීම් සඳහා ලිඛිත සටහනක්\n\n🌐 **ඔන්ලයින් සේවා:**\n   • VillageFlow පද්ධතිය ඔස්සේ බොහෝ සේවා ලබාගත හැක\n   • ඔන්ලයින් ගෙවීම්\n   • අයදුම්පත් තත්වය පරීක්ෂා කිරීම\n   • PDF සහතික බාගත කිරීම\n\n📢 **වැදගත්:** ගැටළුවක් ඇත්නම් මුලින්ම ඔබගේ ප්‍රාදේශීය GN කාර්යාලය අමතන්න",
        
        // Help
        help: "❓ **VillageFlow AI සහායක - උදව් මාර්ගෝපදේශය:**\n\n📌 **මට පිළිතුරු දිය හැකි ප්‍රශ්න වර්ග:**\n\n**1. ගිණුම් කළමනාකරණය**\n   🔹 ලියාපදිංචිය, පුරනය වීම සහ මුරපද\n**2. සේවාවන්**\n   🔹 සහතික, සහනාධර, පත්වීම් සහ ප්‍රොක්සි\n**3. ආපදා සේවා**\n   🔹 SOS ඇඟවීම් සහ සහන කඳවුරු\n**4. යටිතල පහසුකම්**\n   🔹 පැමිණිලි ඉදිරිපත් කිරීම සහ ප්‍රගතිය\n**5. මැතිවරණ**\n   🔹 ඡන්ද හිමි නාමලේඛනය සහ ඡන්ද විස්තර\n**6. නිලධාරී පරිපාලන**\n   🔹 සහතික/සහනාධර අනුමැතිය සහ අනතුරු ඇඟවීම් පළ කිරීම\n\n💡 **ඉඟිය:** ඔබට ඕනෑම ප්‍රශ්නයක් සරල සිංහලෙන්, ඉංග්‍රීසියෙන් හෝ දෙමළෙන් ඇසිය හැක!\n\n📞 **සහාය සඳහා:** 1900 අමතන්න",
        
        // Default
        default: "🙏 **ස්තුතියි ඔබගේ ප්‍රශ්නය සඳහා!**\n\nමම **VillageFlow AI සහායක** වෙමි. මට පිළිතුරු දිය හැකි ප්‍රශ්න:\n\n📝 **ගිණුම්** - ලියාපදිංචිය, පුරනය වීම\n📄 **සේවා** - සහතික, සහනාධර, පත්වීම්, ප්‍රොක්සි\n🚨 **ආපදා** - SOS, ආරක්ෂිත කඳවුරු\n🛣️ **යටිතල පහසුකම්** - පැමිණිලි, ප්‍රගතිය\n🗳️ **මැතිවරණ** - ඡන්ද විස්තර, ඡන්ද මධ්‍යස්ථාන\n💼 **රාජකාරි** - නිලධාරී මගපෙන්වීම්\n\n💬 **කරුණාකර ඔබගේ ප්‍රශ්නය නැවත සඳහන් කරන්න**, නැතහොත් ඔබගේ ප්‍රදේශයේ ග්‍රාම නිලධාරී කාර්යාලය අමතන්න.\n\n📞 **සහාය:** 1900 හෝ villageflow6@gmail.com",

        // New features
        disaster: "🚨 **ආපදා සහ හදිසි SOS සේවා මාර්ගෝපදේශය:**\n\n📌 **හදිසි ආපදා අනතුරු ඇඟවීම්:**\n   • පද්ධතියේ ප්‍රධාන පුවරුව හරහා සජීවී ආපදා ඇඟවීම් නිකුත් කෙරේ.\n   • රතු (අධි අවදානම්), තැඹිලි (මධ්‍යම අවදානම්) සහ කහ (අවධානය අවශ්‍ය) ලෙස මට්ටම් දක්වා ඇත.\n\n🆘 **හදිසි SOS ඉල්ලීමක් යොමු කිරීම:**\n   1. 'Disaster SOS' පිටුවට යන්න.\n   2. 'Send SOS Alert' බොත්තම ක්ලික් කරන්න.\n   3. ඔබගේ වත්මන් පිහිටීම (Location), දුරකථන අංකය සහ හදිසි අවශ්‍යතාවය (වෛද්‍ය, ජලයෙන් යටවීම, ආදිය) දක්වන්න.\n   4. 'Submit SOS' ක්ලික් කළ වහාම ප්‍රාදේශීය ග්‍රාම නිලධාරී වෙත සහ ආපදා කළමනාකරණ මධ්‍යස්ථානයට දැනුම්දීමක් යයි.\n\n🏠 **ආරක්ෂිත සහන කඳවුරු:**\n   • 'Emergency Shelters' ටැබ් එක හරහා ළඟම ඇති කඳවුරු ලැයිස්තුව, ඒවායේ ධාරිතාවය සහ පහසුකම් පරීක්ෂා කළ හැක.\n\n📞 **හදිසි ඇමතුම්:**\n   • ආපදා කළමනාකරණ මධ්‍යස්ථානය: 117\n   • සුවසැරිය ගිලන්රථ සේවය: 1990\n   • පොලිස් හදිසි ඇමතුම්: 119 / 112",

        infrastructure: "🛣️ **යටිතල පහසුකම් පැමිණිලි ඉදිරිපත් කිරීම සහ ප්‍රගතිය:**\n\n📌 **පැමිණිලි කළ හැකි අංශ:**\n   • 🛣️ මාර්ග හා පාලම් හානි (Road Damage & Bridges)\n   • 💧 ජල සැපයුම් ගැටළු (Water Leaks & Supply)\n   • ⚡ විදුලි බිඳවැටීම් (Power Outages & Street Lights)\n   • 🗑️ කසළ කළමනාකරණය (Waste & Garbage Disposal)\n   • 🌊 කාණු පද්ධති හා ගංවතුර ගැටළු (Drainage & Blockages)\n\n📝 **පැමිණිල්ලක් ඉදිරිපත් කිරීමේ පියවර:**\n   1. 'Infrastructure Complaints' පිටුවට පිවිසෙන්න.\n   2. අදාළ කාණ්ඩය (Category) තෝරා ගන්න.\n   3. ස්ථානය (Location), ගැටළුවේ විස්තරය ලියා ප්‍රමුඛතාවය (Priority) තෝරන්න.\n   4. ගැටළුව දැක්වෙන ඡායාරූපයක් ඇත්නම් උඩුගත කරන්න.\n   5. 'Submit Complaint' ක්ලික් කරන්න.\n\n🔍 **ප්‍රගතිය නිරීක්ෂණය:**\n   • 'My Complaints' ටැබ් එකෙන් පැමිණිල්ලේ වත්මන් තත්ත්වය (Submitted 🟡, In Progress 🔵, Resolved 🟢) සහ නිලධාරියාගේ සටහන් (Officer Notes) පරීක්ෂා කළ හැක.",

        election: "🗳️ **මැතිවරණ සහ ඡන්ද විස්තර මාර්ගෝපදේශය:**\n\n📌 **ඡන්ද හිමි නාමලේඛනය සහ තොරතුරු:**\n   • මැතිවරණ කොමිෂන් සභාවේ ලියාපදිංචි ඡන්දදායකයෙකු දැයි පරීක්ෂා කිරීමට VillageFlow මැතිවරණ පිටුව භාවිතා කළ හැක.\n\n🔍 **වැදගත් තොරතුරු:**\n   1. **ඡන්ද මධ්‍යස්ථානය (Polling Station):** ඔබගේ ඡන්ද කාඩ්පතේ ඇති හෝ පද්ධතිය මඟින් පෙන්වන ඡන්ද මධ්‍යස්ථානයට පමණක් ඡන්දය ප්‍රකාශ කළ හැක.\n   2. **අවශ්‍ය ලේඛන:** ඡන්දය ප්‍රකාශ කිරීම සඳහා වලංගು ජාතික හැඳුනුම්පත (NIC), වලංගು විදේශ ගමන් බලපත්‍රය හෝ රියදුරු බලපත්‍රය අනිවාර්ය වේ.\n   3. **ඡන්ද විමසීම් වේලාවන්:** සාමාන්‍යයෙන් පෙ.ව. 7:00 සිට ප.ව. 4:00 දක්වා.\n\n🙋‍♂️ **අපේක්ෂකයින් සහ කොට්ඨාශ:**\n   • ඔබගේ කොට්ඨාශයේ තරඟ කරන අපේක්ෂකයින් ලැයිස්තුව, පක්ෂ තොරතුරු සහ ඡන්ද ප්‍රතිඵල සජීවීව පද්ධතිය හරහා ලබාගත හැක.",

        officer: "💼 **රාජකාරි නිලධාරී (Officer) පරිපාලන මාර්ගෝපදේශය:**\n\n📌 **පරිපාලන කාර්යයන් සහ පියවර:**\n\n1. 📄 **සහතික අනුමත කිරීම (Certificates):**\n   • Dashboard එකේ 'Certificates' යටතේ ලැබී ඇති අයදුම්පත් පරීක්ෂා කරන්න.\n   • පුරවැසියාගේ NIC සහ ලේඛන වලංගු නම් 'Approve' ක්ලික් කර අත්සන් තැබූ සහතිකය උඩුගත කරන්න. නැතහොත් හේතුව දක්වා 'Reject' කරන්න.\n\n2. 🏠 **සහනාධර සැකසීම (Welfare Processing):**\n   • ලැබී ඇති අස්වැසුම/සමෘද්ධි අයදුම්පත්වල ආදායම් තොරතුරු පරීක්ෂා කරන්න.\n   • සුදුසුකම් සපුරා ඇත්නම් නිර්දේශිත දීමනා මට්ටම තෝරා අනුමත කරන්න.\n\n3. 🚨 **ආපදා ඇඟවීම් සහ SOS (Disasters & SOS):**\n   • හදිසි SOS ඉල්ලීම් ලද වහාම ක්‍රියාත්මක වී ආපදා කළමනාකරණ අංශ දැනුවත් කරන්න.\n   • නව අනතුරු ඇඟවීම් නිකුත් කිරීමට 'Post Warning' ක්ලික් කර ප්‍රදේශය, බරපතලකම සහ උපදෙස් ඇතුළත් කරන්න.\n\n4. 🛣️ **යටිතල පහසුකම් පැමිණිලි යාවත්කාලීන කිරීම (Infrastructure):**\n   • පුරවැසි පැමිණිලි පරීක්ෂා කර අදාළ අංශ වෙත යොමු කරන්න.\n   • ප්‍රගතිය 'In Progress' හෝ 'Resolved' ලෙස යාවත්කාලීන කර නිලධාරී සටහන් (Officer Note) ඇතුළත් කරන්න.",
        
        // Error
        noInternet: "⚠️ **අන්තර්ජාල සම්බන්ධතාවයක් නැත!**\n\nකරුණාකර ඔබගේ ජාල සම්බන්ධතාව පරීක්ෂා කර නැවත උත්සාහ කරන්න.\n\n📞 **ප්‍රශ්න සඳහා:** 1900 අමතන්න",
        error: "❌ **සමාවන්න, දෝෂයක් ඇති විය!**\n\nකරුණාකර පසුව නැවත උත්සාහ කරන්න. ගැටළුව දිගටම පවතින්නේ නම්:\n\n📞 **සහාය:** 1900 අමතන්න\n📧 **විද්‍යුත් තැපෑල:** villageflow6@gmail.com"
    },
    
    en: {
        welcome: "👋 **Welcome!** I'm **VillageFlow AI Assistant**.\n\n🏛️ **Government of Sri Lanka Digital Services**\n\n📌 **How I can help you:**\n✅ Account Registration & Login\n✅ Certificate Applications\n✅ Welfare Applications\n✅ Appointment Booking\n✅ Proxy Registration\n✅ Application Status Check\n✅ GN Office Contact\n✅ Payments & Fees\n\n💬 **Ask me anything!**",
        register: "📝 **Complete Registration Guide:**\n\n🔹 **Step 1:** Click 'Register' button\n🔹 **Step 2:** Fill in your details correctly\n🔹 **Step 3:** Create a strong password\n🔹 **Step 4:** Click 'Register Account'\n\n⚠️ **Note:** Age must be 18+ years\n✅ After registration, login with your NIC",
        login: "🔐 **Login Steps:**\n\n🔹 **Step 1:** Click 'Login' button\n🔹 **Step 2:** Enter your NIC number\n🔹 **Step 3:** Enter your password\n🔹 **Step 4:** Select 'Citizen'\n🔹 **Step 5:** Click 'Secure Sign In'\n\n🔑 **Forgot Password?** Contact your GN Office or call 1900",
        proxy: "👴 **Proxy Registration (Elderly Care Service):**\n\n👤 **Eligibility:** Age 65+ or needing home care\n📋 **Documents:** NIC, Age proof, Address proof, Caretaker's NIC\n📝 **Steps:** Visit GN Office → Fill form → Submit documents → Complete registration\n💰 **Fee:** Free\n📞 **Info:** Call 1900",
        certificate: "📄 **Certificate Application Guide:**\n\n📌 **Types & Fees:**\n🏠 Residency - Rs.250\n👤 Character - Rs.200\n💰 Income - Rs.300\n👶 Birth Copy - Rs.150\n\n📝 **Steps:** Certificates page → Scan NIC → Select type → Upload documents → Pay → Submit\n⏰ **Processing:** 3-5 days",
        welfare: "🏠 **Welfare Application Guide:**\n\n**Aswasuma:** Income < Rs.20,000 → Benefit: Rs.5,000-15,000/month\n**Samurdhi:** Income < Rs.15,000 → Benefit: Rs.3,000-10,000/month\n**Elderly:** Age 60+ → Benefit: Rs.2,000-5,000/month\n\n📝 **Apply:** Welfare Apply page → Fill form → Upload income proof → Submit\n⏰ **Processing:** 7-14 days",
        appointment: "📅 **Appointment Booking Guide:**\n\n📝 **Steps:**\n1. Go to 'Appointments' page\n2. Select date (next 14 days)\n3. Choose time (9AM-3PM)\n4. Enter reason and NIC\n5. Submit\n\n✅ **Approval:** 24-48 hours, email/SMS notification",
        status: "📋 **Application Status Guide:**\n\n🟡 **Pending** - Under review\n🟢 **Approved** - Download PDF available\n🔴 **Rejected** - Reason provided\n\n📌 **Check:** Dashboard → 'My Applications'\n📞 **Help:** Call 1900",
        documents: "📄 **Required Documents:**\n\n**Certificates:** NIC copy + Utility bill (last 3 months)\n**Welfare:** NIC copy + Income proof + House number + Bank details\n**Proxy:** Applicant's NIC + Caretaker's NIC + Age proof\n\n📎 **Formats:** PDF, JPEG, PNG (max 5MB)",
        fees: "💰 **Service Fees:**\n\n**Certificates:**\n🏠 Residency - Rs.250\n👤 Character - Rs.200\n💰 Income - Rs.300\n👶 Birth Copy - Rs.150\n\n**Welfare:** Free\n**Appointments:** Free\n**Proxy Registration:** Free\n\n💳 **Payment:** Card, Bank Transfer, Mobile, Cash at GN Office\n👴 **Senior discount:** Free for age 65+",
        time: "⏰ **Processing Times:**\n\n📄 Certificates: 3-5 days\n🏠 Welfare: 7-14 days\n📅 Appointments: 24-48 hours\n👴 Proxy Registration: 5-7 days\n\n⚠️ **Note:** May vary during holidays/peak periods",
        contact: "📞 **Contact Grama Niladhari:**\n\n🏢 **Office:** GN Office, [Your Area]\n📞 **Phone:** 1900\n📧 **Email:** villageflow6@gmail.com\n🕐 **Hours:** Mon-Fri 8:30AM-4:15PM\n\n📍 **Visit with your NIC**",
        help: "❓ **Help Categories:**\n\n1️⃣ **Account** - Registration, Login, Profile\n2️⃣ **Services** - Certificates, Welfare, Appointments, Proxy\n3️⃣ **Disasters** - SOS Reporting, Live Warnings, Evacuation Shelters\n4️⃣ **Infrastructure** - Filing Public Complaints, Status Tracking\n5️⃣ **Elections** - Voter Status, Polling Stations, Candidates\n6️⃣ **Officer Admin** - Approving requests, Publishing alerts, Status Updates\n\n💬 **Ask me anything!**",
        default: "🙏 **Thank you for your question!**\n\nI can help with:\n📝 Account Management\n📄 Services (Certificates, Welfare, Appointments, Proxy)\n🚨 Disasters & Emergency SOS\n🛣️ Infrastructure Complaints\n🗳️ Elections & Voter Listings\n💼 Administrative Tasks (Officers)\n\n💬 **Please rephrase your question** or call 1900 for assistance.",
        
        // New features
        disaster: "🚨 **Disaster Management & Emergency SOS Guide:**\n\n📌 **Live Warnings & Bulletins:**\n   • Real-time disaster alerts are shown on the main dashboard.\n   • Risk levels are color-coded: Red (Critical), Orange (High Risk), Amber (Medium), Yellow (Advisory).\n\n🆘 **Submitting an Emergency SOS Request:**\n   1. Navigate to the 'Disaster SOS' page.\n   2. Click the 'Send SOS Alert' button.\n   3. Provide your current location, mobile number, and description of your emergency.\n   4. Clicking submit alerts the local Grama Niladhari and Disaster Management Centre immediately.\n\n🏠 **Safe Havens & Shelters:**\n   • Use the 'Emergency Shelters' tab to view nearby evacuation shelters, their live capacity, and facilities.\n\n📞 **Emergency Hotlines:**\n   • Disaster Management Centre: 117\n   • Suwaseriya Ambulance Service: 1990\n   • Police Emergency: 119 / 112",

        infrastructure: "🛣️ **Infrastructure Complaint Submission & Tracking:**\n\n📌 **Reportable Categories:**\n   • 🛣️ Road Damage & Potholes\n   • 💧 Water Leaks & Supply Interruption\n   • ⚡ Power Outages & Broken Street Lights\n   • 🗑️ Garbage Disposal & Waste Management\n   • 🌊 Drainage Blockages & Localised Flooding\n\n📝 **How to File a Complaint:**\n   1. Go to the 'Infrastructure Complaints' page.\n   2. Select the category matching your issue.\n   3. Provide details (Location, Description) and choose Priority (Low/Medium/High).\n   4. Upload an optional photograph of the issue.\n   5. Click 'Submit Complaint'.\n\n🔍 **Track Progress:**\n   • View 'My Complaints' to check status updates (Submitted 🟡, In Progress 🔵, Resolved 🟢) and read Grama Niladhari officer notes.",

        election: "🗳️ **Elections & Voter Information Guide:**\n\n📌 **Voter Registration & Status:**\n   • Check your local voter registry status and eligibility online via the VillageFlow Elections portal.\n\n🔍 **Polling Day Requirements:**\n   1. **Polling Station:** You must vote at your designated Polling Station listed on your polling card or system profile.\n   2. **Identity Verification:** Bring a valid NIC, Passport, or Driving License.\n   3. **Voting Hours:** Standard hours are 7:00 AM to 4:00 PM.\n\n🙋‍♂️ **Candidates & Districts:**\n   • View lists of contesting candidates, party symbols, and live division results directly on the portal.",

        officer: "💼 **Administrative Officer Guidelines:**\n\n📌 **Officer Workflow & Steps:**\n\n1. 📄 **Certificate Approvals:**\n   • Go to the 'Certificates' management tab.\n   • Verify applicant NIC and documents. Click 'Approve' to issue signed certificate PDF or 'Reject' with reason.\n\n2. 🏠 **Welfare Verification:**\n   • Review Aswasuma/Samurdhi applications. Check household income proofs. Approve eligibility tier based on criteria.\n\n3. 🚨 **Disaster Alerts & SOS:**\n   • Monitor incoming citizen SOS requests. Forward to emergency services. Publish new regional safety advisories via the portal.\n\n4. 🛣️ **Infrastructure Management:**\n   • Assign filed public complaints to technical teams. Update status to 'In Progress' or 'Resolved' and add officer remarks.",

        noInternet: "⚠️ **No internet connection!** Please check your connection and try again.\n📞 **Support:** 1900",
        error: "❌ **Sorry, an error occurred!** Please try again later.\n📞 **Support:** 1900\n📧 **Email:** villageflow6@gmail.com"
    },
    
    // Tamil version
    ta: {
        welcome: "👋 **வணக்கம்!** நான் **VillageFlow AI உதவியாளர்**.\n\n🏛️ **இலங்கை அரசாங்க டிஜிட்டல் சேவைகள்**\n\n📌 **நான் உதவக்கூடிய வழிகள்:**\n✅ பதிவு & உள்நுழைவு\n✅ சான்றிதழ் விண்ணப்பங்கள்\n✅ நலன்புரி விண்ணப்பங்கள்\n✅ சந்திப்பு முன்பதிவு\n✅ ப்ராக்ஸி பதிவு\n✅ விண்ணப்ப நிலை\n✅ GN அலுவலக தொடர்பு\n✅ கட்டணங்கள்\n\n💬 **என்னை எதையும் கேளுங்கள்!**",
        register: "📝 **பதிவு செய்வதற்கான முழு வழிகாட்டி:**\n\n🔹 **படி 1:** 'Register' பொத்தானைக் கிளிக் செய்யவும்\n🔹 **படி 2:** உங்கள் விவரங்களை நிரப்பவும்\n🔹 **படி 3:** கடவுச்சொல்லை உருவாக்கவும்\n🔹 **படி 4:** 'Register Account' கிளிக் செய்யவும்\n\n⚠️ **குறிப்பு:** வயது 18+ இருக்க வேண்டும்\n✅ பதிவுக்குப் பிறகு, உங்கள் NIC உடன் உள்நுழையவும்",
        login: "🔐 **உள்நுழைவதற்கான படிகள்:**\n\n🔹 **படி 1:** 'Login' பொத்தானைக் கிளிக் செய்யவும்\n🔹 **படி 2:** உங்கள் NIC எண்ணை உள்ளிடவும்\n🔹 **படி 3:** கடவுச்சொல்லை உள்ளிடவும்\n🔹 **படி 4:** 'Citizen' தேர்ந்தெடுக்கவும்\n🔹 **படி 5:** 'Secure Sign In' கிளிக் செய்யவும்\n\n🔑 **கடவுச்சொல் மறந்துவிட்டதா?** GN அலுவலகத்தை தொடர்பு கொள்ளவும் அல்லது 1900 அழைக்கவும்",
        proxy: "👴 **ப்ராக்ஸி பதிவு (முதியோர் பராமரிப்பு சேவை):**\n\n👤 **தகுதி:** வயது 65+ அல்லது வீட்டு பராமரிப்பு தேவை\n📋 **ஆவணங்கள்:** NIC, வயது சான்று, முகவரி சான்று, பராமரிப்பாளரின் NIC\n📝 **படிகள்:** GN அலுவலகத்தை பார்வையிடவும் → படிவத்தை நிரப்பவும் → ஆவணங்களை சமர்ப்பிக்கவும் → பதிவை முடிக்கவும்\n💰 **கட்டணம்:** இலவசம்\n📞 **தகவலுக்கு:** 1900 அழைக்கவும்",
        certificate: "📄 **சான்றிதழ் விண்ணப்ப வழிகாட்டி:**\n\n📌 **வகைகள் & கட்டணங்கள்:**\n🏠 குடியிருப்பு - ரூ.250\n👤 குணநலன் - ரூ.200\n💰 வருமானம் - ரூ.300\n👶 பிறப்பு நகல் - ரூ.150\n\n📝 **படிகள்:** சான்றிதழ்கள் பக்கம் → NIC ஸ்கேன் செய்யவும் → வகையை தேர்ந்தெடுக்கவும் → ஆவணங்களை பதிவேற்றவும் → கட்டணம் → சமர்ப்பிக்கவும்\n⏰ **செயலாக்கம்:** 3-5 நாட்கள்",
        welfare: "🏠 **நலன்புரி விண்ணப்ப வழிகாட்டி:**\n\n**அஸ்வசும:** வருமானம் < ரூ.20,000 → பலன்: ரூ.5,000-15,000/மாதம்\n**சமுர்த்தி:** வருமானம் < ரூ.15,000 → பலன்: ரூ.3,000-10,000/மாதம்\n**முதியோர்:** வயது 60+ → பலன்: ரூ.2,000-5,000/மாதம்\n\n📝 **விண்ணப்பிக்க:** நலன்புரி விண்ணப்பிக்க பக்கம் → படிவத்தை நிரப்பவும் → வருமான ஆதாரத்தை பதிவேற்றவும் → சமர்ப்பிக்கவும்\n⏰ **செயலாக்கம்:** 7-14 நாட்கள்",
        appointment: "📅 **சந்திப்பு முன்பதிவு வழிகாட்டி:**\n\n📝 **படிகள்:**\n1. 'சந்திப்புகள்' பக்கத்திற்குச் செல்லுங்கள்\n2. தேதியைத் தேர்ந்தெடுக்கவும் (அடுத்த 14 நாட்கள்)\n3. நேரத்தைத் தேர்ந்தெடுக்கவும் (9AM-3PM)\n4. காரணம் மற்றும் NIC உள்ளிடவும்\n5. சமர்ப்பிக்கவும்\n\n✅ **அனுமதி:** 24-48 மணி நேரம், மின்னஞ்சல்/SMS அறிவிப்பு",
        status: "📋 **விண்ணப்ப நிலை வழிகாட்டி:**\n\n🟡 **Pending** - மதிப்பாய்வில் உள்ளது\n🟢 **Approved** - PDF பதிவிறக்கம் கிடைக்கும்\n🔴 **Rejected** - காரணத்துடன்\n\n📌 **சரிபார்க்க:** டாஷ்போர்டு → 'எனது விண்ணப்பங்கள்'\n📞 **உதவி:** 1900 அழைக்கவும்",
        documents: "📄 **தேவையான ஆவணங்கள்:**\n\n**சான்றிதழ்கள்:** NIC நகல் + பயன்பாட்டு பில் (கடந்த 3 மாதங்கள்)\n**நலன்புரி:** NIC நகல் + வருமான ஆதாரம் + வீட்டு எண் + வங்கி விவரங்கள்\n**ப்ராக்ஸி:** விண்ணப்பதாரரின் NIC + பராமரிப்பாளரின் NIC + வயது சான்று\n\n📎 **வடிவங்கள்:** PDF, JPEG, PNG (அதிகபட்சம் 5MB)",
        fees: "💰 **சேவை கட்டணங்கள்:**\n\n**சான்றிதழ்கள்:**\n🏠 குடியிருப்பு - ரூ.250\n👤 குணநலன் - ரூ.200\n💰 வருமானம் - ரூ.300\n👶 பிறப்பு நகல் - ரூ.150\n\n**நலன்புரி:** இலவசம்\n**சந்திப்புகள்:** இலவசம்\n**ப்ராக்ஸி பதிவு:** இலவசம்\n\n💳 **கட்டணம்:** அட்டை, வங்கி பரிமாற்றம், கைபேசி, GN அலுவலகத்தில் ரொக்கம்\n👴 **மூத்தோர் சலுகை:** வயது 65+ இலவசம்",
        time: "⏰ **செயலாக்க நேரங்கள்:**\n\n📄 சான்றிதழ்கள்: 3-5 நாட்கள்\n🏠 நலன்புரி: 7-14 நாட்கள்\n📅 சந்திப்புகள்: 24-48 மணி நேரம்\n👴 ப்ராக்ஸி பதிவு: 5-7 நாட்கள்\n\n⚠️ **குறிப்பு:** விடுமுறை/உச்ச நேரங்களில் மாறுபடலாம்",
        contact: "📞 **கிராம அதிகாரியை தொடர்பு கொள்ள:**\n\n🏢 **அலுவலகம்:** GN அலுவலகம், [உங்கள் பகுதி]\n📞 **தொலைபேசி:** 1900\n📧 **மின்னஞ்சல்:** gn@villageflow.gov.lk\n🕐 **நேரம்:** திங்-வெள் 8:30AM-4:15PM\n\n📍 **உங்கள் NIC உடன் வாருங்கள்**",
        help: "❓ **உதவி வகைகள்:**\n\n1️⃣ **கணக்கு** - பதிவு, உள்நுழைவு, சுயவிவரம்\n2️⃣ **சேவைகள்** - சான்றிதழ்கள், நலன்புரி, சந்திப்புகள், ப்ராக்ஸி\n3️⃣ **பேரிடர்** - SOS புகாரளிப்பு, நேரடி எச்சரிக்கைகள், பாதுகாப்பு முகாம்கள்\n4️⃣ **உள்கட்டமைப்பு** - பொது புகார்கள், நிலை கண்காணிப்பு\n5️⃣ **தேர்தல்** - வாக்காளர் பதிவு, வாக்குச்சாவடிகள், வேட்பாளர்கள்\n6️⃣ **நிர்வாக பணிகள்** - விண்ணப்பங்களை அனுமதித்தல், எச்சரிக்கைகளை வெளியிடுதல்\n\n💬 **என்னை எதையும் கேளுங்கள்!**",
        default: "🙏 **உங்கள் கேள்விக்கு நன்றி!**\n\nநான் உதவக்கூடியவை:\n📝 கணக்கு மேலாண்மை\n📄 சேவைகள் (சான்றிதழ்கள், நலன்புரி, சந்திப்புகள், ப்ராக்ஸி)\n🚨 பேரிடர் & அவசர SOS\n🛣️ உள்கட்டமைப்பு புகார்கள்\n🗳️ தேர்தல் & வாக்கு விவரங்கள்\n💼 நிர்வாக பணிகள் (அதிகாரிகள்)\n\n💬 **தயவுசெய்து உங்கள் கேள்வியை மீண்டும் கேளுங்கள்** அல்லது உதவிக்கு 1900 அழைக்கவும்.",
        
        // New features
        disaster: "🚨 **பேரிடர் மேலாண்மை & அவசர SOS வழிகாட்டி:**\n\n📌 **நேரடி எச்சரிக்கைகள்:**\n   • பேரிடர் எச்சரிக்கைகள் பிரதான பக்கத்தில் நேரலையாகக் காட்டப்படும்.\n   • சிவப்பு (அதி அபாயம்), ஆரஞ்சு (மத்திய அபாயம்) மற்றும் மஞ்சள் (எச்சரிக்கை) என அளவுகள் குறிக்கப்படும்.\n\n🆘 **அவசர SOS கோரிக்கையை சமர்ப்பித்தல்:**\n   1. 'Disaster SOS' பக்கத்திற்குச் செல்லவும்.\n   2. 'Send SOS Alert' பொத்தானைக் கிளிக் செய்யவும்.\n   3. உங்கள் தற்போதைய இருப்பிடம், தொலைபேசி எண் மற்றும் அவசர தேவையை உள்ளிடவும்.\n   4. சமர்ப்பித்தவுடன் கிராம அதிகாரி மற்றும் பேரிடர் மேலாண்மை மையத்திற்கு உடனடி அறிவிப்பு செல்லும்.\n\n🏠 **பாதுகாப்பு முகாம்கள்:**\n   • 'Emergency Shelters' பகுதி மூலம் அருகிலுள்ள முகாம்கள், அவற்றின் கொள்ளளவு மற்றும் வசதிகளை சரிபார்க்கலாம்.\n\n📞 **அவசர எண்கள்:**\n   • பேரிடர் மேலாண்மை மையம்: 117\n   • 1990 சுவசேரிய ஆம்புலன்ஸ்: 1990\n   • பொலிஸ் அவசர உதவி: 119 / 112",

        infrastructure: "🛣️ **உள்கட்டமைப்பு புகார்கள் சமர்ப்பிப்பு & கண்காணிப்பு:**\n\n📌 **புகார் செய்யக்கூடிய பிரிவுகள்:**\n   • 🛣️ சாலைகள் மற்றும் பாலங்கள் சேதம்\n   • 💧 குடிநீர் விநியோக பிரச்சினைகள்\n   • ⚡ மின்சார தடை மற்றும் தெருவிளக்கு பழுது\n   • 🗑️ குப்பைகளை அகற்றுதல்\n   • 🌊 வடிகால் அடைப்பு மற்றும் வெள்ள அபாயம்\n\n📝 **புகார் அளிக்கும் படிநிலைகள்:**\n   1. 'Infrastructure Complaints' பக்கத்திற்குச் செல்லவும்.\n   2. பொருத்தமான பிரிவைத் தேர்ந்தெடுக்கவும்.\n   3. இருப்பிடம், பிரச்சினையின் விவரத்தை தட்டச்சு செய்து முன்னுரிமையை (Priority) தேர்வு செய்யவும்.\n   4. புகைப்படங்களை பதிவேற்றி 'Submit Complaint' கிளிக் செய்யவும்.\n\n🔍 **நிலை கண்காணிப்பு:**\n   • 'My Complaints' பகுதி மூலம் உங்கள் புகாரின் நிலையை (Submitted 🟡, In Progress 🔵, Resolved 🟢) மற்றும் அதிகாரியின் குறிப்புகளை அறியலாம்.",

        election: "🗳️ **தேர்தல் மற்றும் வாக்கு விவரங்கள் வழிகாட்டி:**\n\n📌 **வாக்காளர் பதிவு நிலை:**\n   • வாக்குரிமை தகுதியை சரிபார்க்க VillageFlow தேர்தல் பக்கத்தை பயன்படுத்தலாம்.\n\n🔍 **முக்கிய தகவல்கள்:**\n   1. **வாக்குச்சாவடி:** உங்கள் வாக்கு அட்டையில் குறிப்பிடப்பட்டுள்ள வாக்குச்சாவடியில் மட்டுமே வாக்களிக்க முடியும்.\n   2. **ஆவணங்கள்:** வாக்களிக்க செல்லும்போது செல்லுபடியாகும் NIC, கடவுச்சீட்டு அல்லது ஓட்டுநர் உரிமம் அவசியம்.\n   3. **நேரம்:** காலை 7:00 மணி முதல் மாலை 4:00 மணி வரை.\n\n🙋‍♂️ **வேட்பாளர்கள்:**\n   • உங்கள் வட்டாரத்தில் போட்டியிடும் வேட்பாளர்கள் பட்டியல் மற்றும் நேரடி தேர்தல் முடிவுகளை தளத்தில் பார்க்கலாம்.",

        officer: "💼 **நிர்வாக அதிகாரி வழிகாட்டுதல்கள்:**\n\n📌 **அலுவல் பணிகள்:**\n\n1. 📄 **சான்றிதழ் அங்கீகாரம்:**\n   • விண்ணப்பதாரரின் ஆவணங்களை சரிபார்த்து, அங்கீகரிக்கவும் (Approve) அல்லது நிராகரிக்கவும் (Reject).\n\n2. 🏠 **நலன்புரி மேலாண்மை:**\n   • அஸ்வசும/சமுர்த்தி விண்ணப்பங்களைச் சரிபார்த்து வருமானத் தகுதிக்கு ஏற்ப ஒப்புதல் அளிக்கவும்.\n\n3. 🚨 **பேரிடர் எச்சரிக்கை & SOS:**\n   • அவசர SOS கோரிக்கைகளை கண்காணித்து நடவடிக்கை எடுக்கவும். புதிய பேரிடர் எச்சரிக்கைகளை வெளியிடவும்.\n\n4. 🛣️ **உள்கட்டமைப்பு புகார் மேலாண்மை:**\n   • பொது புகார்களை தொழில்நுட்ப குழுக்களுக்கு அனுப்பி, அவற்றின் நிலையை 'In Progress' அல்லது 'Resolved' என புதுப்பிக்கவும்.",

        noInternet: "⚠️ **இணைய இணைப்பு இல்லை!** உங்கள் இணைப்பை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.\n📞 **உதவி:** 1900",
        error: "❌ **மன்னிக்கவும், பிழை ஏற்பட்டது!** தயவுசெய்து பின்னர் மீண்டும் முயற்சிக்கவும்.\n📞 **உதவி:** 1900\n📧 **மின்னஞ்சல்:** support@villageflow.gov.lk"
    }
};

// Smart response detection with context
const getResponse = (message, lang = 'si') => {
    const msg = message.toLowerCase();
    const t = responses[lang] || responses.si;
    
    console.log(`🔍 Analyzing: "${msg.substring(0, 50)}..."`);
    
    // Registration related
    if (msg.includes('ලියාපදිංචි') || msg.includes('register') || msg.includes('பதிவு') ||
        msg.includes('ගිණුමක්') || msg.includes('account') || msg.includes('கணக்கு') ||
        msg.includes('sign up') || msg.includes('create account')) {
        return t.register;
    }
    
    // Login related
    if (msg.includes('පුරනය') || msg.includes('login') || msg.includes('உள்நுழை') ||
        msg.includes('sign in') || msg.includes('signin') || msg.includes('log in')) {
        return t.login;
    }
    
    // Proxy registration
    if (msg.includes('ප්‍රොක්සි') || msg.includes('proxy') || msg.includes('ப்ராக்ஸி') ||
        msg.includes('වැඩිහිටි') || msg.includes('elderly') || msg.includes('முதியோர்') ||
        msg.includes('caretaker') || msg.includes('care giver')) {
        return t.proxy;
    }
    
    // Certificates
    if (msg.includes('සහතික') || msg.includes('certificate') || msg.includes('சான்றிதழ்') ||
        msg.includes('පදිංචි') || msg.includes('residency') || msg.includes('character') ||
        msg.includes('income') || msg.includes('birth') || msg.includes('උප්පැන්න')) {
        return t.certificate;
    }
    
    // Welfare
    if (msg.includes('සහනාධ') || msg.includes('welfare') || msg.includes('நலன்புரி') ||
        msg.includes('අස්වැසුම') || msg.includes('aswasuma') || msg.includes('asvasuma') ||
        msg.includes('සමෘද්ධි') || msg.includes('samurdhi') || msg.includes('elderly allowance')) {
        return t.welfare;
    }
    
    // Appointments
    if (msg.includes('පත්වීම්') || msg.includes('appointment') || msg.includes('சந்திப்பு') ||
        msg.includes('වෙන්ක') || msg.includes('book') || msg.includes('முன்பதிவு') ||
        msg.includes('meeting') || msg.includes('schedule')) {
        return t.appointment;
    }
    
    // Status
    if (msg.includes('තත්ව') || msg.includes('status') || msg.includes('நிலை') ||
        msg.includes('අනුමත') || msg.includes('approved') || msg.includes('pending') ||
        msg.includes('rejected') || msg.includes('ප්‍රතික්ෂේප')) {
        return t.status;
    }
    
    // Documents
    if (msg.includes('ලේඛන') || msg.includes('documents') || msg.includes('ஆவண') ||
        msg.includes('අවශ්‍ය') || msg.includes('required') || msg.includes('தேவை') ||
        msg.includes('files') || msg.includes('upload')) {
        return t.documents;
    }
    
    // Fees/Payments
    if (msg.includes('ගාස්තු') || msg.includes('fees') || msg.includes('கட்டண') ||
        msg.includes('මුදල') || msg.includes('amount') || msg.includes('பணம்') ||
        msg.includes('ගෙවීම්') || msg.includes('payment') || msg.includes('கட்டணம்') ||
        msg.includes('cost') || msg.includes('price')) {
        return t.fees;
    }
    
    // Time/Duration
    if (msg.includes('කාල') || msg.includes('time') || msg.includes('நேரம்') ||
        msg.includes('දින') || msg.includes('days') || msg.includes('நாட்கள்') ||
        msg.includes('පැය') || msg.includes('hours') || msg.includes('மணி') ||
        msg.includes('how long') || msg.includes('duration')) {
        return t.time;
    }
    
    // Contact GN
    if (msg.includes('ග්‍රාම') || msg.includes('niladhari') || msg.includes('அலுவலர்') ||
        msg.includes('අමත') || msg.includes('contact') || msg.includes('தொடர்பு') ||
        msg.includes('දුරකථන') || msg.includes('phone') || msg.includes('தொலைபேசி') ||
        msg.includes('office') || msg.includes('address') || msg.includes('location')) {
        return t.contact;
    }
    
    // Disaster & SOS
    if (msg.includes('ආපදා') || msg.includes('කඳවුරු') || msg.includes('disaster') ||
        msg.includes('sos') || msg.includes('shelter') || msg.includes('emergency') ||
        msg.includes('safety') || msg.includes('warning') || msg.includes('பேரிடர்') ||
        msg.includes('அவசர') || msg.includes('முகாம்') || msg.includes('danger') ||
        msg.includes('හදිසි')) {
        return t.disaster;
    }
    
    // Infrastructure
    if (msg.includes('යටිතල') || msg.includes('පැමිණිලි') || msg.includes('complaint') ||
        msg.includes('road') || msg.includes('water') || msg.includes('electricity') ||
        msg.includes('street') || msg.includes('trash') || msg.includes('garbage') ||
        msg.includes('drainage') || msg.includes('repair') || msg.includes('உள்கட்டமைப்பு') ||
        msg.includes('புகார்') || msg.includes('පාලම්') || msg.includes('විදුලි')) {
        return t.infrastructure;
    }
    
    // Elections
    if (msg.includes('ඡන්ද') || msg.includes('මැතිවරණ') || msg.includes('election') ||
        msg.includes('vote') || msg.includes('voter') || msg.includes('candidate') ||
        msg.includes('poll') || msg.includes('தேர்தல்') || msg.includes('வாக்கு') ||
        msg.includes('හිමි') || msg.includes('නාමලේඛන')) {
        return t.election;
    }
    
    // Officer tasks
    if (msg.includes('නිලධාරී') || msg.includes('රාජකාරි') || msg.includes('officer') ||
        msg.includes('admin') || msg.includes('approve') || msg.includes('verify') ||
        msg.includes('update') || msg.includes('management') || msg.includes('අනුමත') ||
        msg.includes('அதிகாரி') || msg.includes('நிர்வாக') || msg.includes('workflow')) {
        return t.officer;
    }
    
    // Help
    if (msg.includes('උදව්') || msg.includes('help') || msg.includes('உதவி') ||
        msg.includes('කාණ්ඩ') || msg.includes('categories') || msg.includes('வகைகள்') ||
        msg.includes('මොනවා') || msg.includes('what') || msg.includes('என்ன') ||
        msg.includes('how to') || msg.includes('guide')) {
        return t.help;
    }
    
    // Greetings
    if (msg.includes('හලෝ') || msg.includes('hello') || msg.includes('ஹலோ') ||
        msg.includes('hi') || msg.includes('ආයුබෝවන්') || msg.includes('வணக்கம்') ||
        msg.includes('good morning') || msg.includes('good afternoon')) {
        return t.welcome;
    }
    
    // Default
    return t.default;
};

// Chat endpoint
router.post('/chat', chatbotLimiter, async (req, res) => {
    try {
        const { message, userRole = 'citizen', lang = 'si' } = req.body;
        
        console.log(`📨 Chat - Lang: ${lang}, Role: ${userRole}, Msg: "${message?.substring(0, 50)}..."`);
        
        if (!message || message.trim() === '') {
            const emptyResponse = lang === 'si' ? 'කරුණාකර ප්‍රශ්නයක් ඇසීමට ලියන්න.' : 
                                 (lang === 'ta' ? 'தயவுசெய்து ஒரு கேள்வியைத் தட்டச்சு செய்யவும்.' : 
                                 'Please type a question.');
            return res.json({ success: true, reply: emptyResponse });
        }
        
        // Get smart response
        const reply = getResponse(message, lang);
        
        console.log(`✅ Response sent (${reply.length} chars)`);
        res.json({ success: true, reply });
        
    } catch (error) {
        console.error('❌ Chat Error:', error.message);
        const lang = req.body?.lang || 'si';
        const fallbackReply = responses[lang]?.error || responses.si.error;
        res.json({ success: false, reply: fallbackReply });
    }
});

module.exports = router;