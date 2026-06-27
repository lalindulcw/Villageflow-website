import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../services/languageService';
import axios from 'axios';
import { API_BASE, BASE_URL } from '../config';                    
import { createWorker } from 'tesseract.js';  
import { 
    Camera, Upload, Loader2, Clock, ShieldCheck, 
    Trash2, Download, AlertCircle, 
    CheckCircle2, Edit3, Activity, Landmark, Info, User, Users, FileText, Search, ShieldAlert,
    Wifi, WifiOff, CreditCard, Printer, RefreshCw, Eye, X, Building2,
    ArrowRight, Smartphone
} from 'lucide-react';                      
import jsPDF from 'jspdf';                   
import autoTable from 'jspdf-autotable';   
import QRCode from 'qrcode';                


const translations = {
    en: { 
        title: "VillageFlow Digital Portal", 
        lock: "Identity Lock", 
        scanOwner: "Scan your NIC to unlock the form", 
        self: "Myself", 
        family: "Family Member", 
        certType: "Certificate Type", 
        child: "Child (Under 18)", 
        memberNic: "Scan Member NIC", 
        verified: "Verification Successful", 
        notVerified: "NIC Mismatch / Not Registered", 
        submit: "Submit Application", 
        update: "Update Application", 
        reason: "Rejection Reason", 
        relation: "Relationship",
        editApplication: "Edit Application",
        scanProfileNIC: "SCAN PROFILE NIC",
        scanning: "Scanning...",
        verifying: "Verified: Data exists in system",
        notRegistered: "Unregistered member. Please register first.",
        processing: "Processing...",
        submitSuccess: "Application submitted successfully!",
        updateSuccess: "Application updated successfully!",
        submitFailed: "Submission failed (Server Error 500)",
        rejectReason: "Rejection Reason:",
        deleteConfirm: "Delete this application?",
        downloadCert: "Download Certificate (PDF)",
        history: "Application Status and History",
        noApps: "No applications submitted yet.",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        applied: "Applied",
        liveUpdate: "LIVE UPDATE:",
        liveMessage: "Your application is being reviewed. PDF will be available upon approval.",
        certificate: "Certificate",
        proofAddress: "Proof of Address (NIC/Electricity/Water Bill)",
        cancel: "Cancel",
        requiredDocs: "Required Documents Upload",
        fullName: "Full Name",
        relationship: "Relationship",
        memberNIC: "Member NIC Number",
        familyMember: "Family Member",
        fileTooLarge: "File size must be less than 5MB",
        invalidFileType: "Only JPG, PNG, or PDF files are allowed",
        duplicateApplication: "You already have a pending application for this certificate type",
        approvedCertificateExists: "You already have an approved certificate of this type",
        requiredDocumentMissing: "Required document (Utility Bill) is missing. Please upload a proof of address.",
        paymentRequired: "Payment required before submission",
        paymentSuccess: "Payment completed successfully!",
        paymentFailed: "Payment failed. Please try again.",
        fee: "Application Fee",
        payNow: "Pay Now",
        offlineMode: "You are offline. Application will be saved and submitted when online.",
        backOnline: "Back online! Submitting saved applications...",
        syncSuccess: "Saved applications submitted successfully!",
        sessionTimeout: "Session expired. Please login again.",
        preview: "Preview Document",
        remove: "Remove",
        print: "Print Certificate",
        share: "Share via SMS",
        applyAgain: "Apply Again",
        resubmit: "Resubmit Application",
        reasonHelp: "Please correct the issue and resubmit",
        ageRestriction: "Age Restriction",
        memberDetails: "Member Details",
        invalidNicFormat: "Invalid NIC format",
        nicMismatch: "NIC does not match",
        selectPaymentMethod: "Select Payment Method",
        cardPayment: "Credit / Debit Card",
        bankPayment: "Bank Transfer",
        mobilePayment: "Mobile Payment",
        offlinePayment: "Pay at GN Office",
        cardNumber: "Card Number",
        cardholderName: "Cardholder Name",
        expiryDate: "Expiry Date (MM/YY)",
        cvv: "CVV",
        bankName: "Bank Name",
        accountNumber: "Account Number",
        accountHolderName: "Account Holder Name",
        branchCode: "Branch Code",
        mobileNumber: "Mobile Number",
        mobileProvider: "Mobile Provider",
        paymentDetails: "Payment Details",
        bankDetails: "Bank Account Details",
        bankInfo: "Bank Information",
        accountInfo: "Account Information",
        bankTransferInstructions: "Bank Transfer Instructions",
        referenceNumber: "Reference Number",
        makePayment: "Make Payment",
        verifyPayment: "Verify Payment",
        paymentReceipt: "Payment Receipt",
        transactionId: "Transaction ID",
        paymentDate: "Payment Date",
        paymentMethod: "Payment Method",
        viewReceipt: "View Receipt",
        downloadReceipt: "Download Receipt",
        paymentConfirmed: "Payment Confirmed",
        paymentPending: "Payment Pending",
        retryPayment: "Retry Payment",
        changeMethod: "Change Payment Method",
        enterCardDetails: "Enter Card Details",
        enterBankDetails: "Enter Bank Account Details",
        enterMobileDetails: "Enter Mobile Payment Details",
        offlinePaymentInfo: "Pay at Grama Niladhari Office",
        offlinePaymentDesc: "Visit your local GN office to pay the fee. Bring your NIC and reference number.",
        payAtOffice: "I will pay at GN Office",
        alreadyPaid: "Already paid at GN Office?",
        enterReceiptNo: "Enter receipt number from GN Office",
        confirmOfflinePayment: "Confirm Offline Payment",
        cardType: "Card Type",
        visa: "Visa",
        mastercard: "Mastercard",
        amex: "American Express",
        certificateTypes: {
            residency: "Residency Certificate (Rs. 250)",
            character: "Character Certificate (Rs. 200)",
            income: "Income Certificate (Rs. 300)",
            birth: "Birth Certificate Copy (Rs. 150)"
        },
        bankAccounts: {
            default: "Peoples Bank",
            defaultAcc: "123-456-789-001",
            alternative: "Bank of Ceylon",
            altAcc: "789-012-345-678"
        },
        providers: {
            dialog: "Dialog eZ Cash",
            mobitel: "mCash",
            hutch: "Hutch Wallet"
        },
        relationshipOptions: {
            husband: "Husband", wife: "Wife", mother: "Mother", father: "Father",
            child: "Child", sibling: "Sibling", grandmother: "Grandmother", grandfather: "Grandfather"
        },
        memberNotRegistered: "Not registered",
        memberNotAdult: "Must be 18+ years old",
        memberRegistered: "Eligible to apply",
        selectRelationship: "Select relationship",
        invalidMember: "Invalid member",
        paymentMethods: { card: "Credit/Debit Card", mobile: "Mobile Payment", bank: "Bank Transfer", offline: "Pay at Office" },
        continue: "Continue",
        sriLankanBanks: {
            commercial: "Commercial Bank",
            peoples: "Peoples Bank",
            boc: "Bank of Ceylon",
            sampath: "Sampath Bank",
            hnb: "Hatton National Bank",
            nsb: "National Savings Bank",
            dfcc: "DFCC Bank",
            seylan: "Seylan Bank",
            union: "Union Bank",
            cbc: "CBC Bank",
            ndb: "NDB Bank",
            amana: "Amana Bank"
        },
        cardValidation: {
            invalidNumber: "Invalid card number",
            invalidExpiry: "Invalid expiry date",
            invalidCvv: "Invalid CVV",
            cardTypeDetected: "Card type detected"
        }
    },
    si: { 
        title: "VillageFlow ඩිජිටල් ද්වාරය", 
        lock: "අනන්‍යතා අගුල", 
        scanOwner: "පෝරමය විවෘත කිරීමට ඔබගේ NIC එක ස්කෑන් කරන්න", 
        self: "මා හට", 
        family: "පවුලේ සාමාජිකයෙකුට", 
        certType: "සහතික වර්ගය", 
        child: "අවු: 18 ට අඩු දරුවෙකි", 
        memberNic: "සාමාජිකයාගේ NIC ස්කෑන් කරන්න", 
        verified: "සත්‍යාපනය සාර්ථකයි", 
        notVerified: "NIC අංකය නොගැලපේ / ලියාපදිංචි නොවේ", 
        submit: "අයදුම්පත යොමු කරන්න", 
        update: "අයදුම්පත යාවත්කාලීන කරන්න", 
        reason: "ප්‍රතික්ෂේප වීමට හේතුව", 
        relation: "සම්බන්ධතාවය",
        editApplication: "අයදුම්පත සංස්කරණය",
        scanProfileNIC: "ප්‍රොෆයිල් NIC එක ස්කෑන් කරන්න",
        scanning: "පිරික්සමින් පවතී...",
        verifying: "සත්‍යාපිතයි: දත්ත පද්ධතියේ පවතී",
        notRegistered: "ලියාපදිංචි නොවූ සාමාජිකයෙකි",
        processing: "සැකසෙමින් පවතී...",
        submitSuccess: "අයදුම්පත සාර්ථකව යොමු කරන ලදී!",
        updateSuccess: "අයදුම්පත සාර්ථකව යාවත්කාලීන කරන ලදී!",
        submitFailed: "යොමු කිරීම අසාර්ථකයි",
        rejectReason: "ප්‍රතික්ෂේප වීමට හේතුව:",
        deleteConfirm: "මෙම අයදුම්පත මකා දමන්නද?",
        downloadCert: "සහතිකය බාගත කරන්න (PDF)",
        history: "අයදුම්පත් තත්ත්වය සහ ඉතිහාසය",
        noApps: "තවමත් අයදුම්පත් යොමු කර නැත.",
        pending: "බලාපොරොත්තුවෙන්",
        approved: "අනුමතයි",
        rejected: "ප්‍රතික්ෂේපයි",
        applied: "ඉදිරිපත් කරන ලදී",
        liveUpdate: "සජීවී යාවත්කාලීනය:",
        liveMessage: "ඔබගේ අයදුම්පත පරීක්ෂාවට ලක්වෙමින් පවතී",
        certificate: "සහතිකය",
        proofAddress: "NIC/විදුලි/ජල බිල්පතක්",
        cancel: "අවලංගු කරන්න",
        requiredDocs: "අවශ්‍ය ලේඛන උඩුගත කිරීම",
        fullName: "සම්පූර්ණ නම",
        relationship: "සම්බන්ධතාවය",
        memberNIC: "සාමාජිකයාගේ NIC අංකය",
        familyMember: "පවුලේ සාමාජිකයෙකුට",
        fileTooLarge: "ගොනුවේ ප්‍රමාණය 5MB ට වඩා අඩු විය යුතුය",
        invalidFileType: "JPG, PNG, හෝ PDF පමණක් අවසර දෙනු ලැබේ",
        duplicateApplication: "මෙම සහතිකය සඳහා දැනටමත් බලාපොරොත්තුවෙන අයදුම්පතක් ඇත",
        approvedCertificateExists: "මෙම සහතිකය දැනටමත් අනුමත කර ඇත",
        requiredDocumentMissing: "NIC/විදුලි/ජල බිල්පත අවශ්‍ය වේ",
        paymentRequired: "ගෙවීම අවශ්‍ය වේ",
        paymentSuccess: "ගෙවීම සාර්ථකයි!",
        paymentFailed: "ගෙවීම අසාර්ථකයි",
        fee: "ගාස්තුව",
        payNow: "දැන් ගෙවන්න",
        offlineMode: "අන්තර්ජාලය නැත. අයදුම්පත save කර ඇත",
        backOnline: "අන්තර්ජාලය ලැබුණි! සුරකින ලද අයදුම්පත් යොමු වේ",
        syncSuccess: "සුරකින ලද අයදුම්පත් සාර්ථකව යොමු විය!",
        sessionTimeout: "සැසිය කල් ඉකුත් විය. නැවත පුරනය වන්න",
        preview: "ලේඛනය පෙරදසුන",
        remove: "ඉවත් කරන්න",
        print: "මුද්‍රණය කරන්න",
        share: "SMS එකක් යවන්න",
        applyAgain: "නැවත අයදුම් කරන්න",
        resubmit: "නැවත යොමු කරන්න",
        reasonHelp: "කරුණාකර ගැටලුව නිවැරදි කර නැවත උත්සාහ කරන්න",
        ageRestriction: "වයස් සීමාව",
        memberDetails: "සාමාජික විස්තර",
        invalidNicFormat: "වලංගු නොවන NIC ආකෘතිය",
        nicMismatch: "NIC අංකය නොගැලපේ",
        selectPaymentMethod: "ගෙවීමේ ක්‍රමය තෝරන්න",
        cardPayment: "ක්‍රෙඩිට් / ඩෙබිට් කාඩ්",
        bankPayment: "බැංකු හුවමාරුව",
        mobilePayment: "ජංගම ගෙවීම",
        offlinePayment: "ප්‍රාදේශීය ලේකම් කාර්යාලයෙන් ගෙවන්න",
        cardNumber: "කාඩ් අංකය",
        cardholderName: "කාඩ් හිමි නම",
        expiryDate: "කල් ඉකුත්වන දිනය (මා/ව)",
        cvv: "CVV",
        bankName: "බැංකුවේ නම",
        accountNumber: "ගිණුම් අංකය",
        accountHolderName: "ගිණුම් හිමි නම",
        branchCode: "ශාඛා කේතය",
        mobileNumber: "ජංගම දුරකථන අංකය",
        mobileProvider: "ජංගම සේවා සපයන්නා",
        paymentDetails: "ගෙවීම් විස්තර",
        bankDetails: "බැංකු ගිණුම් විස්තර",
        bankInfo: "බැංකු තොරතුරු",
        accountInfo: "ගිණුම් තොරතුරු",
        bankTransferInstructions: "බැංකු හුවමාරු උපදෙස්",
        referenceNumber: "යොමු අංකය",
        makePayment: "ගෙවීම සිදු කරන්න",
        verifyPayment: "ගෙවීම තහවුරු කරන්න",
        paymentReceipt: "ගෙවීම් රිසිට්පත",
        transactionId: "ගනුදෙනු අංකය",
        paymentDate: "ගෙවූ දිනය",
        paymentMethod: "ගෙවීමේ ක්‍රමය",
        viewReceipt: "රිසිට්පත බලන්න",
        downloadReceipt: "රිසිට්පත බාගන්න",
        paymentConfirmed: "ගෙවීම තහවුරුයි",
        paymentPending: "ගෙවීම එනතෙක් බලාපොරොත්තුවෙන්",
        retryPayment: "නැවත උත්සාහ කරන්න",
        changeMethod: "ගෙවීමේ ක්‍රමය වෙනස් කරන්න",
        enterCardDetails: "කාඩ් විස්තර ඇතුළත් කරන්න",
        enterBankDetails: "බැංකු ගිණුම් විස්තර ඇතුළත් කරන්න",
        enterMobileDetails: "ජංගම ගෙවීම් විස්තර ඇතුළත් කරන්න",
        offlinePaymentInfo: "ග්‍රාම නිලධාරි කාර්යාලයෙන් ගෙවන්න",
        offlinePaymentDesc: "ගාස්තුව ගෙවීමට ඔබේ ප්‍රාදේශීය ග්‍රාම නිලධාරි කාර්යාලයට පිවිසෙන්න. ඔබගේ NIC සහ යොමු අංකය රැගෙන එන්න.",
        payAtOffice: "මම ග්‍රාම නිලධාරි කාර්යාලයෙන් ගෙවන්නම්",
        alreadyPaid: "දැනටමත් ග්‍රාම නිලධාරි කාර්යාලයෙන් ගෙවා තිබේද?",
        enterReceiptNo: "ග්‍රාම නිලධාරි කාර්යාලයෙන් ලැබුණු රිසිට්පත් අංකය ඇතුළත් කරන්න",
        confirmOfflinePayment: "ප්‍රාදේශීය ගෙවීම තහවුරු කරන්න",
        cardType: "කාඩ් වර්ගය",
        visa: "වීසා",
        mastercard: "මාස්ටර්කාඩ්",
        amex: "ඇමරිකන් එක්ස්ප්‍රස්",
        certificateTypes: {
            residency: "පදිංචි සහතිකය (රු. 250)",
            character: "චරිත සහතිකය (රු. 200)",
            income: "ආදායම් සහතිකය (රු. 300)",
            birth: "උප්පැන්න සහතික පිටපත (රු. 150)"
        },
        bankAccounts: {
            default: "පීපල්ස් බැංකුව",
            defaultAcc: "123-456-789-001",
            alternative: "බැංකු ඔෆ් සිලෝන්",
            altAcc: "789-012-345-678"
        },
        providers: {
            dialog: "ඩයලොග් ඊස් කෑෂ්",
            mobitel: "එම් කෑෂ්",
            hutch: "හච් වොලට්"
        },
        relationshipOptions: {
            husband: "සැමියා", wife: "බිරිඳ", mother: "මව", father: "පියා",
            child: "දරුවා", sibling: "සහෝදර/සහෝදරිය", grandmother: "ආච්චි", grandfather: "සීයා"
        },
        memberNotRegistered: "ලියාපදිංචි කර නැත",
        memberNotAdult: "වයස අවුරුදු 18 ට වැඩි විය යුතුය",
        memberRegistered: "අයදුම් කිරීමට සුදුසුයි",
        selectRelationship: "සම්බන්ධතාවය තෝරන්න",
        invalidMember: "වලංගු නොවන සාමාජිකයෙකි",
        paymentMethods: { card: "ක්‍රෙඩිට් කාඩ්", mobile: "ජංගම ගෙවීම්", bank: "බැංකු හුවමාරුව", offline: "කාර්යාලයෙන් ගෙවන්න" },
        continue: "ඉදිරියට",
        sriLankanBanks: {
            commercial: "කොමර්ෂල් බැංකුව",
            peoples: "පීපල්ස් බැංකුව",
            boc: "බැංකු ඔෆ් සිලෝන්",
            sampath: "සම්පත් බැංකුව",
            hnb: "හැටන් නැෂනල් බැංකුව",
            nsb: "ජාතික ඉතිරි කිරීමේ බැංකුව",
            dfcc: "ඩීඑෆ්සීසී බැංකුව",
            seylan: "සෙයිලන් බැංකුව",
            union: "යූනියන් බැංකුව",
            cbc: "සීබීසී බැංකුව",
            ndb: "එන්ඩීබී බැංකුව",
            amana: "අමාන බැංකුව"
        },
        cardValidation: {
            invalidNumber: "වලංගු නොවන කාඩ් අංකය",
            invalidExpiry: "වලංගු නොවන කල් ඉකුත්වන දිනය",
            invalidCvv: "වලංගු නොවන CVV",
            cardTypeDetected: "කාඩ් වර්ගය හඳුනාගනු ලැබේ"
        }
    },
    ta: { 
        title: "VillageFlow டிஜிட்டல் போர்டல்", 
        lock: "அடையாள பூட்டு", 
        scanOwner: "படிவத்தை திறக்க உங்கள் NIC ஐ ஸ்கேன் செய்யவும்", 
        self: "எனக்கு", 
        family: "குடும்ப உறுப்பினர்", 
        certType: "சான்றிதழ் வகை", 
        child: "குழந்தை (18 வயதுக்குட்பட்ட)", 
        memberNic: "உறுப்பினர் NIC ஐ ஸ்கேன் செய்யவும்", 
        verified: "சரிபார்ப்பு வெற்றிகரமானது", 
        notVerified: "NIC பொருந்தவில்லை / பதிவு செய்யப்படவில்லை", 
        submit: "விண்ணப்பத்தை சமர்ப்பிக்கவும்", 
        update: "விண்ணப்பத்தை புதுப்பிக்கவும்", 
        reason: "நிராகரிப்பு காரணம்", 
        relation: "உறவுமுறை",
        editApplication: "விண்ணப்பத்தை திருத்தவும்",
        scanProfileNIC: "சுயவிவர NIC ஐ ஸ்கேன் செய்யவும்",
        scanning: "ஸ்கேன் செய்யப்படுகிறது...",
        verifying: "சரிபார்க்கப்பட்டது",
        notRegistered: "பதிவு செய்யப்படாத உறுப்பினர்",
        processing: "செயலாக்கப்படுகிறது...",
        submitSuccess: "விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!",
        updateSuccess: "விண்ணப்பம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!",
        submitFailed: "சமர்ப்பிப்பு தோல்வியடைந்தது",
        rejectReason: "நிராகரிப்பு காரணம்:",
        deleteConfirm: "இந்த விண்ணப்பத்தை நீக்கவா?",
        downloadCert: "சான்றிதழை பதிவிறக்கவும்",
        history: "விண்ணப்ப நிலை மற்றும் வரலாறு",
        noApps: "இதுவரை விண்ணப்பங்கள் எதுவும் சமர்ப்பிக்கப்படவில்லை",
        pending: "நிலுவையில்",
        approved: "அங்கீகரிக்கப்பட்டது",
        rejected: "நிராகரிக்கப்பட்டது",
        applied: "சமர்ப்பிக்கப்பட்டது",
        liveUpdate: "நேரடி புதுப்பிப்பு:",
        liveMessage: "உங்கள் விண்ணப்பம் மதிப்பாய்வு செய்யப்படுகிறது",
        certificate: "சான்றிதழ்",
        proofAddress: "NIC/முகவரி சான்று",
        cancel: "ரத்து செய்யவும்",
        requiredDocs: "தேவையான ஆவணங்களை பதிவேற்றவும்",
        fullName: "முழு பெயர்",
        relationship: "உறவுமுறை",
        memberNIC: "உறுப்பினரின் NIC எண்",
        familyMember: "குடும்ப உறுப்பினர்",
        fileTooLarge: "கோப்பு அளவு 5MB க்கும் குறைவாக இருக்க வேண்டும்",
        invalidFileType: "JPG, PNG, அல்லது PDF கோப்புகள் மட்டுமே அனுமதிக்கப்படும்",
        duplicateApplication: "ஏற்கனவே நிலுவையில் உள்ள விண்ணப்பம் உள்ளது",
        approvedCertificateExists: "ஏற்கனவே அங்கீகரிக்கப்பட்ட சான்றிதழ் உள்ளது",
        requiredDocumentMissing: "முகவரிச் சான்று தேவை",
        paymentRequired: "கட்டணம் தேவை",
        paymentSuccess: "கட்டணம் வெற்றிகரமாக!",
        paymentFailed: "கட்டணம் தோல்வியடைந்தது",
        fee: "விண்ணப்பக் கட்டணம்",
        payNow: "இப்போது செலுத்துங்கள்",
        offlineMode: "இணையம் இல்லை. விண்ணப்பம் சேமிக்கப்பட்டது",
        backOnline: "இணையம் கிடைத்தது!",
        syncSuccess: "சேமித்த விண்ணப்பங்கள் சமர்ப்பிக்கப்பட்டன!",
        sessionTimeout: "அமர்வு காலாவதியானது",
        preview: "ஆவண முன்னோட்டம்",
        remove: "அகற்று",
        print: "அச்சிடுக",
        share: "SMS அனுப்புக",
        applyAgain: "மீண்டும் விண்ணப்பிக்கவும்",
        resubmit: "மீண்டும் சமர்ப்பிக்கவும்",
        reasonHelp: "சிக்கலை சரிசெய்து மீண்டும் முயற்சிக்கவும்",
        ageRestriction: "வயது வரம்பு",
        memberDetails: "உறுப்பினர் விவரங்கள்",
        invalidNicFormat: "தவறான NIC வடிவம்",
        nicMismatch: "NIC பொருந்தவில்லை",
        selectPaymentMethod: "கட்டண முறையைத் தேர்ந்தெடுக்கவும்",
        cardPayment: "கிரெடிட் / டெபிட் கார்டு",
        bankPayment: "வங்கி பரிமாற்றம்",
        mobilePayment: "கைபேசி கட்டணம்",
        offlinePayment: "ஜிஎன் அலுவலகத்தில் செலுத்துக",
        cardNumber: "அட்டை எண்",
        cardholderName: "அட்டைதாரர் பெயர்",
        expiryDate: "காலாவதி தேதி (மாதம்/வருடம்)",
        cvv: "CVV",
        bankName: "வங்கியின் பெயர்",
        accountNumber: "கணக்கு எண்",
        accountHolderName: "கணக்கு வைத்திருப்பவர் பெயர்",
        branchCode: "கிளைக் குறியீடு",
        mobileNumber: "கைபேசி எண்",
        mobileProvider: "கைபேசி வழங்குநர்",
        paymentDetails: "கட்டண விவரங்கள்",
        bankDetails: "வங்கிக் கணக்கு விவரங்கள்",
        bankInfo: "வங்கி தகவல்கள்",
        accountInfo: "கணக்குத் தகவல்கள்",
        bankTransferInstructions: "வங்கி பரிமாற்ற வழிமுறைகள்",
        referenceNumber: "குறிப்பு எண்",
        makePayment: "கட்டணம் செலுத்து",
        verifyPayment: "கட்டணத்தை சரிபார்க்கவும்",
        paymentReceipt: "கட்டண ரசீது",
        transactionId: "பரிவர்த்தனை ID",
        paymentDate: "கட்டண தேதி",
        paymentMethod: "கட்டண முறை",
        viewReceipt: "ரசீதைக் காண்க",
        downloadReceipt: "ரசீதைப் பதிவிறக்கவும்",
        paymentConfirmed: "கட்டணம் உறுதிப்படுத்தப்பட்டது",
        paymentPending: "கட்டணம் நிலுவையில்",
        retryPayment: "மீண்டும் முயற்சிக்கவும்",
        changeMethod: "கட்டண முறையை மாற்றவும்",
        enterCardDetails: "அட்டை விவரங்களை உள்ளிடுக",
        enterBankDetails: "வங்கிக் கணக்கு விவரங்களை உள்ளிடுக",
        enterMobileDetails: "கைபேசி கட்டண விவரங்களை உள்ளிடுக",
        offlinePaymentInfo: "கிராம நிலதாரி அலுவலகத்தில் செலுத்துக",
        offlinePaymentDesc: "கட்டணத்தை செலுத்த உங்கள் உள்ளூர் ஜிஎன் அலுவலகத்தைப் பார்வையிடவும். உங்கள் NIC மற்றும் குறிப்பு எண்ணைக் கொண்டு வாருங்கள்.",
        payAtOffice: "நான் ஜிஎன் அலுவலகத்தில் செலுத்துகிறேன்",
        alreadyPaid: "ஏற்கனவே ஜிஎன் அலுவலகத்தில் செலுத்தப்பட்டுவிட்டதா?",
        enterReceiptNo: "ஜிஎன் அலுவலகத்திலிருந்து ரசீது எண்ணை உள்ளிடுக",
        confirmOfflinePayment: "ஆஃப்லைன் கட்டணத்தை உறுதிப்படுத்துக",
        cardType: "அட்டை வகை",
        visa: "விசா",
        mastercard: "மாஸ்டர்கார்டு",
        amex: "அமெரிக்கன் எக்ஸ்பிரஸ்",
        certificateTypes: {
            residency: "குடியிருப்பு சான்றிதழ் (ரூ. 250)",
            character: "குணநலன் சான்றிதழ் (ரூ. 200)",
            income: "வருமான சான்றிதழ் (ரூ. 300)",
            birth: "பிறப்பு சான்றிதழ் நகல் (ரூ. 150)"
        },
        bankAccounts: {
            default: "மக்கள் வங்கி",
            defaultAcc: "123-456-789-001",
            alternative: "இலங்கை வங்கி",
            altAcc: "789-012-345-678"
        },
        providers: {
            dialog: "டயலாக் இசட் கேஷ்",
            mobitel: "எம்கேஷ்",
            hutch: "ஹட்ச் வாலட்"
        },
        relationshipOptions: {
            husband: "கணவன்", wife: "மனைவி", mother: "அம்மா", father: "அப்பா",
            child: "குழந்தை", sibling: "சகோதரன்", grandmother: "பாட்டி", grandfather: "தாத்தா"
        },
        memberNotRegistered: "பதிவு செய்யப்படவில்லை",
        memberNotAdult: "18 வயது அல்லது அதற்கு மேல் இருக்க வேண்டும்",
        memberRegistered: "விண்ணப்பிக்க தகுதியானவர்",
        selectRelationship: "உறவுமுறையைத் தேர்ந்தெடுக்கவும்",
        invalidMember: "தவறான உறுப்பினர்",
        paymentMethods: { card: "கிரெடிட் கார்டு", mobile: "கைபேசி கட்டணம்", bank: "வங்கி பரிமாற்றம்", offline: "அலுவலகத்தில் செலுத்துக" },
        continue: "தொடரவும்",
        sriLankanBanks: {
            commercial: "கொமர்ஷியல் வங்கி",
            peoples: "பீபுள்ஸ் வங்கி",
            boc: "இலங்கை வங்கி",
            sampath: "சம்பத் வங்கி",
            hnb: "ஹட்டன் நேஷனல் வங்கி",
            nsb: "தேசிய சேமிப்பு வங்கி",
            dfcc: "டிஎஃப்சிசி வங்கி",
            seylan: "செலான் வங்கி",
            union: "யூனியன் வங்கி",
            cbc: "சிபிசி வங்கி",
            ndb: "என்டிபி வங்கி",
            amana: "அமானா வங்கி"
        },
        cardValidation: {
            invalidNumber: "தவறான அட்டை எண்",
            invalidExpiry: "தவறான காலாவதி தேதி",
            invalidCvv: "தவறான CVV",
            cardTypeDetected: "அட்டை வகை கண்டறியப்பட்டது"
        }
    }
};


const APPLICATION_FEES = {
    'Residency Certificate': 250,
    'Character Certificate': 200,
    'Income Certificate': 300,
    'Birth Certificate Copy': 150
};


const SRI_LANKAN_BANKS = [
    { code: 'COMMERCIAL', name: 'Commercial Bank of Ceylon', swift: 'CCEYLKLX' },
    { code: 'PEOPLES', name: 'Peoples Bank', swift: 'PSBKLKLX' },
    { code: 'BOC', name: 'Bank of Ceylon', swift: 'BCEYLKLX' },
    { code: 'SAMPATH', name: 'Sampath Bank', swift: 'BSAMLKLX' },
    { code: 'HNB', name: 'Hatton National Bank', swift: 'HBLILKLX' },
    { code: 'NSB', name: 'National Savings Bank', swift: 'NSBLKLX' },
    { code: 'DFCC', name: 'DFCC Bank', swift: 'DFCCLKLX' },
    { code: 'SEYLAN', name: 'Seylan Bank', swift: 'SEYBLKLX' },
    { code: 'UNION', name: 'Union Bank', swift: 'UBCYLKLX' },
    { code: 'CBC', name: 'CBC Bank', swift: 'CBCELKLX' },
    { code: 'NDB', name: 'NDB Bank', swift: 'NDBSLKLX' },
    { code: 'AMANA', name: 'Amana Bank', swift: 'AMNBLKLX' }
];

// MOCK VALIDATION FUNCTIONS (DEMO MODE)
const mockValidateCardNumber = (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length === 16 && /^\d+$/.test(cleaned)) return true;
    if (cleaned.length === 15 && /^\d+$/.test(cleaned)) return true;
    return false;
};

const detectCardType = (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.startsWith('5')) return 'Mastercard';
    if (cleaned.startsWith('3')) return 'Amex';
    if (cleaned.startsWith('6')) return 'Discover';
    return 'Card';
};

const mockValidateExpiry = (expiryDate) => {
    if (!expiryDate.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) return false;
    const [month, year] = expiryDate.split('/');
    const expiryYear = 2000 + parseInt(year);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    if (expiryYear > currentYear) return true;
    if (expiryYear === currentYear && parseInt(month) >= currentMonth) return true;
    return false;
};

const mockValidateCvv = (cvv) => {
    return /^[0-9]{3,4}$/.test(cvv);
};

const mockValidateBankAccount = (accountNumber) => {
    const cleaned = accountNumber.replace(/\s/g, '');
    return cleaned.length >= 8 && cleaned.length <= 20 && /^\d+$/.test(cleaned);
};

const mockValidateMobile = (mobileNumber) => {
    return /^07[0-9]{8}$/.test(mobileNumber);
};

// Shows application progress
const StatusTracker = ({ status, lang }) => {
    const t = translations[lang];
    
    const steps = [
        { label: t.applied, icon: <FileText size={14}/>, color: '#3b82f6' },
        { label: t.pending, icon: <Search size={14}/>, color: '#f59e0b' },
        { label: status === 'Rejected' ? t.rejected : t.approved, 
          icon: status === 'Rejected' ? <ShieldAlert size={14}/> : <CheckCircle2 size={14}/>, 
          color: status === 'Rejected' ? '#ef4444' : '#10b981' }
    ];

    const getStatusIndex = (s) => {
        if (s === 'Pending') return 1;
        if (s === 'Approved' || s === 'Rejected') return 2;
        return 0;
    };

    const currentIndex = getStatusIndex(status);

    return (
        <div className="tracker-wrapper" style={styles.trackerWrapper}>
            {steps.map((step, idx) => (
                <React.Fragment key={idx}>
                    <div className="step-container" style={styles.stepContainer}>
                        <div style={{
                            ...styles.stepCircle,
                            backgroundColor: idx <= currentIndex ? step.color : '#e2e8f0',
                            color: idx <= currentIndex ? 'white' : '#94a3b8'
                        }}>
                            {step.icon}
                        </div>
                        <span style={{
                            ...styles.stepLabel,
                            color: idx <= currentIndex ? '#1e293b' : '#94a3b8',
                            fontWeight: idx === currentIndex ? '700' : '500'
                        }}>{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className="step-line" style={{
                            ...styles.stepLine,
                            backgroundColor: idx < currentIndex ? steps[idx + 1].color : '#e2e8f0'
                        }} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

// Handles: Card (with Visual Mock & OTP), Bank Transfer (with Slip Upload), Mobile Payment (with OTP), Offline Payment
const PaymentModal = ({ amount, certType, onSuccess, onCancel, lang }) => {
    const t = translations[lang];
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStep, setPaymentStep] = useState('select');
    const [paymentReceipt, setPaymentReceipt] = useState(null);
    const [offlineReceiptNo, setOfflineReceiptNo] = useState('');
    
    // OTP States
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [otpError, setOtpError] = useState('');
    
    // Bank Slip States
    const [bankSlipFile, setBankSlipFile] = useState(null);
    const [bankSlipPreview, setBankSlipPreview] = useState(null);

    const localT = {
        en: {
            otpTitle: "Security Verification",
            otpSentText: "A One-Time Password (OTP) has been sent to your registered mobile number for authentication.",
            enterOtp: "Enter OTP Code",
            verifyBtn: "Verify & Authorize",
            invalidOtp: "Invalid OTP. Please enter 1234 to proceed.",
            otpPlaceholder: "Enter 4-digit code (Use 1234)",
            uploadSlip: "Upload Bank Deposit Slip / Receipt",
            noSlip: "Please upload your deposit slip as proof of payment.",
            slipAttached: "Deposit slip attached",
            processingVerification: "Verifying authorization code...",
            demoCardHint: "Use visa (starts with 4) or mastercard (starts with 5)",
            enterCardDetails: "Enter Card Details",
            enterBankDetails: "Enter Bank Account Details",
            enterMobileDetails: "Enter Mobile Payment Details"
        },
        si: {
            otpTitle: "ආරක්ෂක සත්‍යාපනය",
            otpSentText: "ගනුදෙනුව සත්‍යාපනය කිරීම සඳහා ඔබගේ ලියාපදිංචි ජංගම දුරකථන අංකයට එක් වරක් භාවිත කළ හැකි මුරපදයක් (OTP) යවා ඇත.",
            enterOtp: "OTP කේතය ඇතුළත් කරන්න",
            verifyBtn: "සත්‍යාපනය කර අනුමත කරන්න",
            invalidOtp: "වැරදි OTP කේතයකි. ඉදිරියට යාමට 1234 ඇතුළත් කරන්න.",
            otpPlaceholder: "අංක 4 කේතය ඇතුළත් කරන්න (1234 භාවිත කරන්න)",
            uploadSlip: "තැන්පතු පත්‍රිකාව / රිසිට්පත උඩුගත කරන්න",
            noSlip: "කරුණාකර ගෙවීම් සනාථ කිරීම සඳහා බැංකු පත්‍රිකාව උඩුගත කරන්න.",
            slipAttached: "බැංකු පත්‍රිකාව අමුණා ඇත",
            processingVerification: "කේතය සත්‍යාපනය කරමින් පවතී...",
            demoCardHint: "Visa (4න් ඇරඹේ) හෝ Mastercard (5න් ඇරඹේ) භාවිතා කරන්න",
            enterCardDetails: "කාඩ්පත් විස්තර ඇතුලත් කරන්න",
            enterBankDetails: "බැංකු ගිණුම් විස්තර ඇතුලත් කරන්න",
            enterMobileDetails: "ජංගම ගෙවීම් විස්තර ඇතුලත් කරන්න"
        },
        ta: {
            otpTitle: "பாதுகாப்பு சரிபார்ப்பு",
            otpSentText: "பரிவர்த்தனையை சரிபார்க்க உங்கள் பதிவு செய்யப்பட்ட மொபைல் எண்ணுக்கு ஒரு முறை கடவுச்சொல் (OTP) அனுப்பப்பட்டுள்ளது.",
            enterOtp: "OTP குறியீட்டை உள்ளிடவும்",
            verifyBtn: "சரிபார்த்து அங்கீகரிக்கவும்",
            invalidOtp: "தவறான OTP. தொடர 1234 ஐ உள்ளிடவும்.",
            otpPlaceholder: "4 இலக்க குறியீட்டை உள்ளிடவும் (1234 ஐப் பயன்படுத்தவும்)",
            uploadSlip: "வங்கி வைப்பு சீட்டை பதிவேற்றவும்",
            noSlip: "கட்டண சான்றாக வங்கி வைப்பு சீட்டை பதிவேற்றவும்.",
            slipAttached: "வங்கி வைப்பு சீட்டு இணைக்கப்பட்டுள்ளது",
            processingVerification: "சரிபார்க்கிறது...",
            demoCardHint: "Visa (4 இல் தொடங்கும்) அல்லது Mastercard (5 இல் தொடங்கும்) பயன்படுத்தவும்",
            enterCardDetails: "அட்டை விவரங்களை உள்ளிடவும்",
            enterBankDetails: "வங்கி கணக்கு விவரங்களை உள்ளிடவும்",
            enterMobileDetails: "மொபைல் கட்டண விவரங்களை உள்ளிடவும்"
        }
    };
    const lt = localT[lang] || localT['en'];
    
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
        cardType: ''
    });
    
    const [bankDetails, setBankDetails] = useState({
        bankCode: '',
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        branchCode: '',
        referenceNumber: `VF${Date.now()}${Math.floor(Math.random() * 1000)}`
    });
    
    const [mobileDetails, setMobileDetails] = useState({
        mobileNumber: '',
        provider: 'dialog',
        pin: ''
    });
    
    const [errors, setErrors] = useState({});
    const [cardTypeDetected, setCardTypeDetected] = useState('');

    const handleCardNumberChange = (value) => {
        const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
        setCardDetails({...cardDetails, cardNumber: formatted});
        
        const cleaned = value.replace(/\s/g, '');
        if (cleaned.length >= 4) {
            const detected = detectCardType(cleaned);
            setCardTypeDetected(detected);
            setCardDetails(prev => ({...prev, cardType: detected}));
        }
    };

    const validateCardDetails = () => {
        const newErrors = {};
        const cleanedNumber = cardDetails.cardNumber.replace(/\s/g, '');
        if (!mockValidateCardNumber(cleanedNumber)) {
            newErrors.cardNumber = 'Enter 15-16 digit card number';
        }
        if (!cardDetails.cardholderName.trim()) {
            newErrors.cardholderName = 'Cardholder name required';
        } else if (cardDetails.cardholderName.length < 3) {
            newErrors.cardholderName = 'Enter full name as on card';
        }
        if (!mockValidateExpiry(cardDetails.expiryDate)) {
            newErrors.expiryDate = 'Enter valid expiry date (MM/YY)';
        }
        if (!mockValidateCvv(cardDetails.cvv)) {
            newErrors.cvv = 'Enter 3-4 digit CVV';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateBankDetails = () => {
        const newErrors = {};
        if (!bankDetails.bankCode) newErrors.bankCode = 'Please select a bank';
        if (!bankDetails.accountNumber.trim()) newErrors.accountNumber = 'Account number required';
        if (!mockValidateBankAccount(bankDetails.accountNumber)) {
            newErrors.accountNumber = 'Enter valid account number (8-20 digits)';
        }
        if (!bankDetails.accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name required';
        if (bankDetails.accountHolderName.length < 3) newErrors.accountHolderName = 'Enter full name';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateMobileDetails = () => {
        const newErrors = {};
        if (!mockValidateMobile(mobileDetails.mobileNumber)) {
            newErrors.mobileNumber = 'Enter valid mobile number (07XXXXXXXX)';
        }
        if (!mobileDetails.pin || mobileDetails.pin.length < 4) {
            newErrors.pin = 'PIN required (min 4 digits)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateOfflinePayment = () => {
        if (!offlineReceiptNo.trim()) {
            setErrors({ offlineReceiptNo: 'Receipt number required' });
            return false;
        }
        return true;
    };

    const handlePayment = async () => {
        setErrors({});
        setOtpError('');
        
        if (paymentMethod === 'card') {
            if (!validateCardDetails()) return;
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                setOtpSent(true);
                setOtpCode('1234');
            }, 1500);
        } 
        else if (paymentMethod === 'mobile') {
            if (!validateMobileDetails()) return;
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                setOtpSent(true);
                setOtpCode('1234');
            }, 1500);
        } 
        else if (paymentMethod === 'bank') {
            if (!validateBankDetails()) return;
            if (!bankSlipFile) {
                setErrors({ bankSlip: lt.noSlip });
                return;
            }
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                const selectedBank = SRI_LANKAN_BANKS.find(b => b.code === bankDetails.bankCode);
                const newTransactionId = `BNK${Date.now()}${Math.floor(Math.random() * 10000)}`;
                setPaymentReceipt({
                    amount, certType,
                    bankName: selectedBank?.name || bankDetails.bankName,
                    accountLastFour: bankDetails.accountNumber.slice(-4),
                    accountHolderName: bankDetails.accountHolderName,
                    referenceNumber: bankDetails.referenceNumber,
                    transactionId: newTransactionId,
                    paymentMethod: 'bank',
                    status: 'pending_verification',
                    timestamp: new Date().toISOString(),
                    bankSlipFile: bankSlipFile
                });
                setPaymentStep('receipt');
            }, 1800);
        } 
        else if (paymentMethod === 'offline') {
            if (!validateOfflinePayment()) return;
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                const newTransactionId = `OFF${Date.now()}${Math.floor(Math.random() * 10000)}`;
                setPaymentReceipt({
                    amount, certType,
                    receiptNumber: offlineReceiptNo,
                    transactionId: newTransactionId,
                    paymentMethod: 'offline',
                    status: 'pending_verification',
                    timestamp: new Date().toISOString(),
                    officeName: 'Grama Niladhari Office'
                });
                setPaymentStep('receipt');
            }, 1000);
        }
    };

    const handleVerifyOtp = () => {
        if (otpInput === otpCode) {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                if (paymentMethod === 'card') {
                    const newTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
                    setPaymentReceipt({
                        amount, certType,
                        cardNumber: cardDetails.cardNumber.replace(/\s/g, '').slice(-4),
                        cardType: cardTypeDetected || cardDetails.cardType || 'Visa',
                        cardholderName: cardDetails.cardholderName,
                        transactionId: newTransactionId,
                        paymentMethod: 'card',
                        status: 'success',
                        timestamp: new Date().toISOString()
                    });
                } else if (paymentMethod === 'mobile') {
                    const newTransactionId = `MOB${Date.now()}${Math.floor(Math.random() * 10000)}`;
                    setPaymentReceipt({
                        amount, certType,
                        mobileNumber: mobileDetails.mobileNumber.slice(-4),
                        provider: mobileDetails.provider,
                        transactionId: newTransactionId,
                        paymentMethod: 'mobile',
                        status: 'success',
                        timestamp: new Date().toISOString()
                    });
                }
                setOtpSent(false);
                setPaymentStep('receipt');
            }, 1500);
        } else {
            setOtpError(lt.invalidOtp);
        }
    };

    const confirmPayment = () => {
        if (paymentReceipt) {
            onSuccess({
                transactionId: paymentReceipt.transactionId,
                paymentMethod: paymentReceipt.paymentMethod,
                amount: paymentReceipt.amount,
                status: paymentReceipt.status === 'success' ? 'completed' : 'pending_verification',
                
                cardLastFour: paymentReceipt.cardNumber || null,
                cardType: paymentReceipt.cardType || null,
                cardholderName: paymentReceipt.cardholderName || null,
                mobileNumber: paymentReceipt.mobileNumber || null,
                provider: paymentReceipt.provider || null,
                bankName: paymentReceipt.bankName || null,
                accountLastFour: paymentReceipt.accountLastFour || null,
                accountHolderName: paymentReceipt.accountHolderName || null,
                branchCode: paymentReceipt.branchCode || null,
                referenceNumber: paymentReceipt.referenceNumber || null,
                receiptNumber: paymentReceipt.receiptNumber || null,
                bankSlipFile: paymentReceipt.bankSlipFile || null
            });
        } else {
            onSuccess(null);
        }
    };

    const downloadReceipt = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.setTextColor(128, 0, 0);
        doc.text("PAYMENT RECEIPT", 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Transaction ID: ${paymentReceipt.transactionId}`, 20, 45);
        doc.text(`Date: ${new Date().toLocaleString()}`, 20, 52);
        doc.text(`Certificate Type: ${certType}`, 20, 59);
        doc.text(`Amount: Rs. ${amount}/=`, 20, 66);
        doc.text(`Payment Method: ${paymentReceipt.paymentMethod.toUpperCase()}`, 20, 73);
        if (paymentReceipt.cardNumber) doc.text(`Card: ****${paymentReceipt.cardNumber}`, 20, 80);
        if (paymentReceipt.cardType) doc.text(`Card Type: ${paymentReceipt.cardType}`, 20, 87);
        if (paymentReceipt.referenceNumber) doc.text(`Reference: ${paymentReceipt.referenceNumber}`, 20, 80);
        if (paymentReceipt.mobileNumber) doc.text(`Mobile: ****${paymentReceipt.mobileNumber}`, 20, 80);
        if (paymentReceipt.receiptNumber) doc.text(`GN Office Receipt: ${paymentReceipt.receiptNumber}`, 20, 80);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("This is a computer-generated receipt for demonstration purposes.", 105, 120, { align: 'center' });
        doc.text("VillageFlow Digital Governance Platform - Campus Project", 105, 125, { align: 'center' });
        doc.save(`Payment_Receipt_${paymentReceipt.transactionId}.pdf`);
    };

    if (otpSent) {
        return (
            <div style={styles.modalOverlay}>
                <div className="modal-content" style={{...styles.modalContent, maxWidth: '420px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                        <h3 style={{ margin: 0, color: '#8B0000', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={20} color="#8B0000" /> {lt.otpTitle}
                        </h3>
                        <button onClick={() => setOtpSent(false)} style={styles.modalClose}><X size={20}/></button>
                    </div>
                    <div style={styles.modalBody}>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
                            {lt.otpSentText}
                        </p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fffbeb', border: '1px dashed #f59e0b', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
                            <Smartphone size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                                Simulated SMS: Your verification code is <strong style={{ fontSize: '14px', color: '#854d0e' }}>1234</strong>
                            </span>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.fieldLabel}>{lt.enterOtp}</label>
                            <input 
                                style={{...styles.inputField, letterSpacing: '4px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', borderColor: otpError ? '#ef4444' : '#e2e8f0'}} 
                                placeholder="••••" 
                                value={otpInput} 
                                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))} 
                                maxLength="4" 
                            />
                            {otpError && <span style={styles.errorText}>{otpError}</span>}
                        </div>
                    </div>
                    <div style={{...styles.modalFooter, display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button onClick={() => setOtpSent(false)} style={{...styles.cancelPaymentBtn, flex: 1}}>{t.cancel}</button>
                        <button onClick={handleVerifyOtp} style={{...styles.paymentBtn, flex: 2}} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                            {isProcessing ? lt.processingVerification : lt.verifyBtn}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (paymentStep === 'receipt' && paymentReceipt) {
        return (
            <div style={styles.modalOverlay}>
                <div className="modal-content" style={{...styles.modalContent, maxWidth: '500px'}}>
                    <div style={styles.modalHeader}>
                        <h3>{t.paymentReceipt}</h3>
                        <button onClick={onCancel} style={styles.modalClose}><X size={20}/></button>
                    </div>
                    <div style={styles.modalBody}>
                        <div style={styles.receiptContainer}>
                            <div style={styles.receiptSuccessIcon}><CheckCircle2 size={48} color="#10b981" /></div>
                            <h4 style={styles.receiptTitle}>{t.paymentConfirmed}</h4>
                            <div style={styles.receiptDetails}>
                                <div style={styles.receiptRow}><span>{t.transactionId}:</span><strong>{paymentReceipt.transactionId}</strong></div>
                                <div style={styles.receiptRow}><span>{t.certType}:</span><strong>{certType}</strong></div>
                                <div style={styles.receiptRow}><span>{t.fee}:</span><strong style={{color: '#8B0000'}}>Rs. {amount}/=</strong></div>
                                <div style={styles.receiptRow}><span>{t.paymentMethod}:</span><strong>{paymentReceipt.paymentMethod === 'offline' ? t.offlinePayment : t.paymentMethods[paymentReceipt.paymentMethod] || paymentReceipt.paymentMethod}</strong></div>
                                <div style={styles.receiptRow}><span>{t.paymentDate}:</span><strong>{new Date().toLocaleString()}</strong></div>
                                {paymentReceipt.cardType && <div style={styles.receiptRow}><span>Card Type:</span><strong>{paymentReceipt.cardType}</strong></div>}
                            </div>
                            <button onClick={downloadReceipt} style={styles.downloadReceiptBtn}><Download size={16} /> {t.downloadReceipt}</button>
                        </div>
                    </div>
                    <div style={styles.modalFooter}>
                        <button onClick={confirmPayment} style={styles.paymentBtn}><CheckCircle2 size={18} /> {t.continue}</button>
                    </div>
                </div>
            </div>
        );
    }

    if (paymentStep === 'details') {
        return (
            <div style={styles.modalOverlay}>
                <div className="modal-content" style={{...styles.modalContent, maxWidth: '500px'}}>
                    <div style={styles.modalHeader}>
                        <h3>{paymentMethod === 'card' ? lt.enterCardDetails : paymentMethod === 'bank' ? lt.enterBankDetails : paymentMethod === 'mobile' ? lt.enterMobileDetails : t.offlinePaymentInfo}</h3>
                        <button onClick={() => setPaymentStep('select')} style={styles.modalClose}><X size={20}/></button>
                    </div>
                    <div style={styles.modalBody}>
                        {paymentMethod === 'card' && (
                            <div>
                                {/* Visual Credit Card Mockup */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    color: 'white',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '180px',
                                    boxSizing: 'border-box',
                                    fontFamily: 'Courier, monospace'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ background: '#f59e0b', width: '45px', height: '32px', borderRadius: '4px' }} />
                                        <span style={{ fontSize: '18px', fontWeight: 'bold', fontStyle: 'italic' }}>
                                            {cardTypeDetected ? cardTypeDetected.toUpperCase() : 'CARD'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '20px', letterSpacing: '2px', margin: '20px 0 10px' }}>
                                        {cardDetails.cardNumber || '•••• •••• •••• ••••'}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.6, fontFamily: 'sans-serif' }}>Cardholder Name</div>
                                            <div style={{ fontSize: '14px', letterSpacing: '1px' }}>{cardDetails.cardholderName || 'FULL NAME'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.6, fontFamily: 'sans-serif' }}>Expires</div>
                                            <div style={{ fontSize: '14px' }}>{cardDetails.expiryDate || 'MM/YY'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>{t.cardNumber}</label>
                                    <input style={{...styles.inputField, borderColor: errors.cardNumber ? '#ef4444' : '#e2e8f0'}} placeholder="1234 5678 9012 3456" value={cardDetails.cardNumber} onChange={(e) => handleCardNumberChange(e.target.value)} maxLength="19" />
                                    {errors.cardNumber && <span style={styles.errorText}>{errors.cardNumber}</span>}
                                    <span style={{...styles.demoHint, color: '#64748b'}}>{lt.demoCardHint}</span>
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>{t.cardholderName}</label>
                                    <input style={{...styles.inputField, borderColor: errors.cardholderName ? '#ef4444' : '#e2e8f0'}} placeholder="JOHN DOE" value={cardDetails.cardholderName} onChange={(e) => setCardDetails({...cardDetails, cardholderName: e.target.value.toUpperCase()})} />
                                    {errors.cardholderName && <span style={styles.errorText}>{errors.cardholderName}</span>}
                                </div>
                                <div className="row-two-cols" style={styles.rowTwoCols}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.fieldLabel}>{t.expiryDate}</label>
                                        <input style={{...styles.inputField, borderColor: errors.expiryDate ? '#ef4444' : '#e2e8f0'}} placeholder="MM/YY" value={cardDetails.expiryDate} onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})} maxLength="5" />
                                        {errors.expiryDate && <span style={styles.errorText}>{errors.expiryDate}</span>}
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.fieldLabel}>{t.cvv}</label>
                                        <input style={{...styles.inputField, borderColor: errors.cvv ? '#ef4444' : '#e2e8f0'}} placeholder="123" type="password" maxLength="4" value={cardDetails.cvv} onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})} />
                                        {errors.cvv && <span style={styles.errorText}>{errors.cvv}</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                        {paymentMethod === 'bank' && (
                            <div>
                                <div style={styles.bankInfoBox}>
                                    <Building2 size={20} color="#8B0000" />
                                    <div>
                                        <strong>{t.bankInfo}</strong>
                                        <p style={styles.bankInfoText}>Peoples Bank - 123-456-789-001</p>
                                        <p style={styles.bankInfoText}>{t.referenceNumber}: {bankDetails.referenceNumber}</p>
                                    </div>
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>{t.bankName}</label>
                                    <select style={{...styles.selectField, borderColor: errors.bankCode ? '#ef4444' : '#e2e8f0'}} value={bankDetails.bankCode} onChange={(e) => {
                                        const selected = SRI_LANKAN_BANKS.find(b => b.code === e.target.value);
                                        setBankDetails({...bankDetails, bankCode: e.target.value, bankName: selected?.name || ''});
                                    }}>
                                        <option value="">Select Sri Lankan Bank</option>
                                        {SRI_LANKAN_BANKS.map(bank => (<option key={bank.code} value={bank.code}>{bank.name}</option>))}
                                    </select>
                                    {errors.bankCode && <span style={styles.errorText}>{errors.bankCode}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>{t.accountNumber}</label>
                                    <input style={{...styles.inputField, borderColor: errors.accountNumber ? '#ef4444' : '#e2e8f0'}} placeholder="123456789012" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})} />
                                    {errors.accountNumber && <span style={styles.errorText}>{errors.accountNumber}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>{t.accountHolderName}</label>
                                    <input style={{...styles.inputField, borderColor: errors.accountHolderName ? '#ef4444' : '#e2e8f0'}} placeholder="Account holder name" value={bankDetails.accountHolderName} onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value.toUpperCase()})} />
                                    {errors.accountHolderName && <span style={styles.errorText}>{errors.accountHolderName}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>{t.branchCode}</label>
                                    <input style={styles.inputField} placeholder="Branch code (optional)" value={bankDetails.branchCode} onChange={(e) => setBankDetails({...bankDetails, branchCode: e.target.value})} />
                                </div>

                                {/* Bank Slip Upload Field */}
                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>{lt.uploadSlip} *</label>
                                    <div style={{
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: '10px',
                                        padding: '20px',
                                        textAlign: 'center',
                                        background: '#f8fafc',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setBankSlipFile(file);
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => setBankSlipPreview(ev.target.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }} 
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                opacity: 0,
                                                cursor: 'pointer'
                                            }} 
                                        />
                                        {bankSlipPreview ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <img src={bankSlipPreview} alt="Slip preview" style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '4px' }} />
                                                <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: 600 }}>{bankSlipFile.name}</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                                                <Upload size={24} color="#8B0000" />
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#8B0000' }}>Choose Slip File</span>
                                                <span style={{ fontSize: '11px' }}>Support: JPG, PNG (Max 5MB)</span>
                                            </div>
                                        )}
                                    </div>
                                    {errors.bankSlip && <span style={styles.errorText}>{errors.bankSlip}</span>}
                                </div>
                            </div>
                        )}
                        {paymentMethod === 'mobile' && (
                            <div>
                                <div style={styles.providerSelector}>
                                    <button onClick={() => setMobileDetails({...mobileDetails, provider: 'dialog'})} style={{...styles.providerBtn, background: mobileDetails.provider === 'dialog' ? '#e31e24' : '#f1f5f9', color: mobileDetails.provider === 'dialog' ? 'white' : '#64748b'}}>Dialog</button>
                                    <button onClick={() => setMobileDetails({...mobileDetails, provider: 'mobitel'})} style={{...styles.providerBtn, background: mobileDetails.provider === 'mobitel' ? '#00a651' : '#f1f5f9', color: mobileDetails.provider === 'mobitel' ? 'white' : '#64748b'}}>Mobitel</button>
                                    <button onClick={() => setMobileDetails({...mobileDetails, provider: 'hutch'})} style={{...styles.providerBtn, background: mobileDetails.provider === 'hutch' ? '#ff6600' : '#f1f5f9', color: mobileDetails.provider === 'hutch' ? 'white' : '#64748b'}}>Hutch</button>
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>{t.mobileNumber}</label>
                                    <input style={{...styles.inputField, borderColor: errors.mobileNumber ? '#ef4444' : '#e2e8f0'}} placeholder="0712345678" value={mobileDetails.mobileNumber} onChange={(e) => setMobileDetails({...mobileDetails, mobileNumber: e.target.value.replace(/[^0-9]/g, '')})} maxLength="10" />
                                    {errors.mobileNumber && <span style={styles.errorText}>{errors.mobileNumber}</span>}
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>PIN / Password</label>
                                    <input style={{...styles.inputField, borderColor: errors.pin ? '#ef4444' : '#e2e8f0'}} type="password" placeholder="Enter PIN" value={mobileDetails.pin} onChange={(e) => setMobileDetails({...mobileDetails, pin: e.target.value})} />
                                    {errors.pin && <span style={styles.errorText}>{errors.pin}</span>}
                                </div>
                            </div>
                        )}
                        {paymentMethod === 'offline' && (
                            <div>
                                <div style={styles.offlinePaymentBox}>
                                    <Building2 size={32} color="#8B0000" />
                                    <div>
                                        <strong>{t.offlinePaymentInfo}</strong>
                                        <p>{t.offlinePaymentDesc}</p>
                                    </div>
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.fieldLabel}>{t.enterReceiptNo}</label>
                                    <input style={{...styles.inputField, borderColor: errors.offlineReceiptNo ? '#ef4444' : '#e2e8f0'}} placeholder="GN/RCPT/2024/001" value={offlineReceiptNo} onChange={(e) => setOfflineReceiptNo(e.target.value)} />
                                    {errors.offlineReceiptNo && <span style={styles.errorText}>{errors.offlineReceiptNo}</span>}
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={styles.modalFooter}>
                        <button onClick={handlePayment} style={styles.paymentBtn} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <CreditCard size={18}/>}
                            {isProcessing ? t.processing : `${t.makePayment} - Rs. ${amount}`}
                        </button>
                        <button onClick={() => setPaymentStep('select')} style={styles.cancelPaymentBtn}>{t.cancel}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.modalOverlay}>
            <div className="modal-content" style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <h3>{t.payNow}</h3>
                    <button onClick={onCancel} style={styles.modalClose}><X size={20}/></button>
                </div>
                <div style={styles.modalBody}>
                    <div style={styles.paymentAmount}><span>{t.certType}:</span><strong>{certType}</strong></div>
                    <div style={styles.paymentAmount}><span>{t.fee}:</span><strong style={{color: '#8B0000', fontSize: '24px'}}>Rs. {amount}/=</strong></div>
                    <div className="payment-methods-container" style={styles.paymentMethodsContainer}>
                        <label className="payment-method-card" style={styles.paymentMethodCard}>
                            <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <div className="payment-method-icon" style={styles.paymentMethodIcon}><CreditCard size={24} color="#8B0000" /></div>
                            <div><strong>{t.cardPayment}</strong><p>Visa / Mastercard / Amex</p></div>
                        </label>
                        <label className="payment-method-card" style={styles.paymentMethodCard}>
                            <input type="radio" value="bank" checked={paymentMethod === 'bank'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <div className="payment-method-icon" style={styles.paymentMethodIcon}><Building2 size={24} color="#8B0000" /></div>
                            <div><strong>{t.bankPayment}</strong><p>Direct bank transfer</p></div>
                        </label>
                        <label className="payment-method-card" style={styles.paymentMethodCard}>
                            <input type="radio" value="mobile" checked={paymentMethod === 'mobile'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <div className="payment-method-icon" style={styles.paymentMethodIcon}><Smartphone size={24} color="#8B0000" /></div>
                            <div><strong>{t.mobilePayment}</strong><p>Dialog / Mobitel / Hutch</p></div>
                        </label>
                        <label className="payment-method-card" style={styles.paymentMethodCard}>
                            <input type="radio" value="offline" checked={paymentMethod === 'offline'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <div className="payment-method-icon" style={styles.paymentMethodIcon}><Building2 size={24} color="#8B0000" /></div>
                            <div><strong>{t.offlinePayment}</strong><p>{t.payAtOffice}</p></div>
                        </label>
                    </div>
                    {paymentMethod === 'bank' && (
                        <div style={styles.bankDetailsDisplay}>
                            <div style={styles.bankDetailsHeader}><Building2 size={16} /> {t.bankDetails}</div>
                            <div style={styles.bankDetailRow}><span>Bank:</span><strong>Peoples Bank</strong></div>
                            <div style={styles.bankDetailRow}><span>Account Name:</span><strong>VillageFlow Digital Services</strong></div>
                            <div style={styles.bankDetailRow}><span>Account Number:</span><strong>123-456-789-001</strong></div>
                            <div style={styles.bankDetailRow}><span>Branch:</span><strong>Colombo</strong></div>
                            <div style={styles.bankDetailRow}><span>SWIFT Code:</span><strong>PSBKLKLX</strong></div>
                        </div>
                    )}
                    {paymentMethod === 'offline' && (
                        <div style={styles.offlineInfoBox}>
                            <p><strong>{t.offlinePaymentInfo}</strong></p>
                            <p>{t.offlinePaymentDesc}</p>
                            <p style={{fontSize: '12px', marginTop: '10px', color: '#8B0000'}}><strong>{t.referenceNumber}:</strong> VF{Date.now()}</p>
                        </div>
                    )}
                    <div style={styles.demoNote}><Info size={14} color="#f59e0b" /><span>Payment Gateway Authorization Required.</span></div>
                </div>
                <div style={styles.modalFooter}>
                    <button onClick={() => setPaymentStep('details')} style={styles.paymentBtn}><ArrowRight size={18} /> {t.enterPaymentDetails}</button>
                    <button onClick={onCancel} style={styles.cancelPaymentBtn}>{t.cancel}</button>
                </div>
            </div>
        </div>
    );
};

// Shows uploaded file preview (image or PDF)
const DocumentPreview = ({ file, onClear, lang }) => {
    const t = translations[lang];
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    }, [file]);

    if (!file) return null;

    return (
        <div style={styles.previewContainer}>
            <div style={styles.previewHeader}>
                <Eye size={14} />
                <span>{t.preview}</span>
                <button onClick={onClear} style={styles.previewRemoveBtn}><X size={14} /> {t.remove}</button>
            </div>
            <div style={styles.previewContent}>
                {preview ? (<img src={preview} alt="Preview" style={styles.previewImage} />) 
                : file.type === 'application/pdf' ? (
                    <div style={styles.pdfPreview}><FileText size={40} color="#8B0000" /><span>{file.name}</span></div>
                ) : (
                    <div style={styles.fileInfo}><Upload size={20} /><span>{file.name}</span></div>
                )}
            </div>
        </div>
    );
};


// Shows offline mode and pending sync count
const OfflineStatusBar = ({ isOnline, pendingSyncCount, lang }) => {
    const t = translations[lang];
    if (isOnline && pendingSyncCount === 0) return null;
    return (
        <div style={{...styles.offlineBar, background: isOnline ? '#10b981' : '#f59e0b'}}>
            {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span>{isOnline ? `${t.backOnline} (${pendingSyncCount} pending)` : t.offlineMode}</span>
        </div>
    );
};

// Auto logout after 30 minutes of inactivity
const useSessionTimeout = (timeoutMinutes = 30, onTimeout) => {
    const [lastActivity, setLastActivity] = useState(Date.now());

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        const resetTimer = () => setLastActivity(Date.now());
        events.forEach(event => document.addEventListener(event, resetTimer));
        const interval = setInterval(() => {
            if (Date.now() - lastActivity > timeoutMinutes * 60 * 1000) onTimeout();
        }, 60000);
        return () => {
            events.forEach(event => document.removeEventListener(event, resetTimer));
            clearInterval(interval);
        };
    }, [lastActivity, timeoutMinutes, onTimeout]);
};

function Member2Certificates() {
    // Language and user data
    const [lang, setLang] = useLanguage();
    const t = translations[lang];
    const userString = localStorage.getItem('user');
    const owner = userString ? JSON.parse(userString) : null;

    // Form state variables
    const [nic, setNic] = useState('');                           
    const [certType, setCertType] = useState('Residency Certificate');  
    const [selectedFile, setSelectedFile] = useState(null);       
    const [isScanning, setIsScanning] = useState(false);          
    const [isSubmitting, setIsSubmitting] = useState(false);      
    const [fileError, setFileError] = useState('');               
    
    const [ownerVerified, setOwnerVerified] = useState(false);    
    const [myApplications, setMyApplications] = useState([]);     
    
    const [applyFor, setApplyFor] = useState('Self');             
    const [isChild, setIsChild] = useState(false);                
    const [memberName, setMemberName] = useState('');              
    const [relationship, setRelationship] = useState('');          
    const [memberAge, setMemberAge] = useState(null);              
    const [memberExists, setMemberExists] = useState(false);       
    const [nicValidFormat, setNicValidFormat] = useState(false);   
    
    const [editId, setEditId] = useState(null);                    
    const [scanMessage, setScanMessage] = useState({ text: '', type: '' });   
    const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });        
    const [memberValidationMsg, setMemberValidationMsg] = useState({ text: '', type: '' }); 
    
    const [showPayment, setShowPayment] = useState(false);          
    const [paymentCompleted, setPaymentCompleted] = useState(false); 
    const [paymentData, setPaymentData] = useState(null);            
    const [isOnline, setIsOnline] = useState(navigator.onLine);      
    const [pendingSyncCount, setPendingSyncCount] = useState(0);     

    // Save application when offline, sync when online
    const storeOfflineApplication = (formData) => {
        const offlineApps = JSON.parse(localStorage.getItem('offlineApplications') || '[]');
        const formDataObj = {};
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                formDataObj[key] = { name: value.name, type: value.type };
            } else {
                formDataObj[key] = value;
            }
        }
        offlineApps.push({ id: Date.now(), data: formDataObj, timestamp: new Date() });
        localStorage.setItem('offlineApplications', JSON.stringify(offlineApps));
        setPendingSyncCount(offlineApps.length);
        return true;
    };

    // Session timeout handler
    const handleSessionTimeout = () => {
        alert(t.sessionTimeout);
        localStorage.removeItem('user');
        window.location.href = '/login';
    };
    useSessionTimeout(30, handleSessionTimeout);

    // Calculate application fee
    const calculateFee = () => {
        const age = applyFor === 'Self' ? calculateAge(owner?.nic) : memberAge;
        if (age && age >= 65) return 0;
        return APPLICATION_FEES[certType] || 250;
    };

    // Validate uploaded file (type and size)
    const validateFile = (file) => {
        if (!file) return true;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        const maxSize = 5 * 1024 * 1024;
        if (!allowedTypes.includes(file.type)) {
            setFileError(t.invalidFileType);
            return false;
        }
        if (file.size > maxSize) {
            setFileError(t.fileTooLarge);
            return false;
        }
        setFileError('');
        return true;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (validateFile(file)) {
            setSelectedFile(file);
            setFileError('');
        } else {
            setSelectedFile(null);
            e.target.value = '';
        }
    };

    // Auto-refresh every 10 seconds //read
    const fetchMyApps = useCallback(async () => {
        if (!owner?._id) return;
        try {
            const res = await axios.get(`${API_BASE}/certificates/user/${owner._id}`);
            if (res.data) {
                setMyApplications([...res.data].sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)));
            }
        } catch (err) { console.error("History Error", err); }
    }, [owner?._id]);

    useEffect(() => {
        fetchMyApps();
        const interval = setInterval(fetchMyApps, 10000);
        return () => clearInterval(interval);
    }, [fetchMyApps]);

    // Sync offline applications when back online
    const syncOfflineApplications = useCallback(async () => {
        let offlineApps = JSON.parse(localStorage.getItem('offlineApplications') || '[]');
        if (offlineApps.length === 0) return;
        const failedSyncs = [];
        for (const app of offlineApps) {
            try {
                const formData = new FormData();
                for (const [key, value] of Object.entries(app.data)) {
                    formData.append(key, value);
                }
                await axios.post(`${API_BASE}/certificates/apply`, formData);
            } catch (err) {
                failedSyncs.push(app);
            }
        }
        if (failedSyncs.length > 0) {
            localStorage.setItem('offlineApplications', JSON.stringify(failedSyncs));
        } else {
            localStorage.removeItem('offlineApplications');
        }
        setPendingSyncCount(failedSyncs.length);
        if (failedSyncs.length < offlineApps.length) {
            setStatusMsg({ text: t.syncSuccess, type: 'success' });
            fetchMyApps();
            setTimeout(() => setStatusMsg({ text: '', type: '' }), 3000);
        }
    }, [t, fetchMyApps]);

    // Online/Offline event listeners
    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); syncOfflineApplications(); };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        const pending = JSON.parse(localStorage.getItem('offlineApplications') || '[]');
        setPendingSyncCount(pending.length);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncOfflineApplications]);

    // VALIDATION FUNCTIONS
    const hasDuplicateApplication = (certTypeValue, memberNicValue, excludeId = null) => {
        return myApplications.some(app => 
            app.certificateType === certTypeValue && 
            app.nic === memberNicValue && 
            app.status === 'Pending' &&
            (excludeId ? app._id !== excludeId : true)
        );
    };

    const hasApprovedCertificate = (certTypeValue, memberNicValue, excludeId = null) => {
        return myApplications.some(app => 
            app.certificateType === certTypeValue && 
            app.nic === memberNicValue && 
            app.status === 'Approved' &&
            (excludeId ? app._id !== excludeId : true)
        );
    };

    // Calculate age from NIC number
    const calculateAge = (nicValue) => {
        if (!nicValue) return null;
        let year;
        if (nicValue.length === 10) {
            year = parseInt(nicValue.substring(0, 2));
            year = 1900 + year;
        } else if (nicValue.length === 12) {
            year = parseInt(nicValue.substring(0, 4));
        } else {
            return null;
        }
        const birthDate = new Date(year, 0, 1);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    // Validate NIC format 
    const validateNicFormat = (nicValue) => {
        const oldNicPattern = /^[0-9]{9}[vVxX]$/;
        const newNicPattern = /^[0-9]{12}$/;
        return oldNicPattern.test(nicValue) || newNicPattern.test(nicValue);
    };

    // Validate family member against backend database
    const validateFamilyMember = useCallback(async (nicValue) => {
        if (!nicValue || nicValue.length === 0) {
            setMemberValidationMsg({ text: '', type: '' });
            setMemberExists(false);
            setMemberAge(null);
            setMemberName('');
            setNicValidFormat(false);
            return false;
        }
        if (!validateNicFormat(nicValue)) {
            setMemberValidationMsg({ text: t.invalidNicFormat, type: 'error' });
            setMemberExists(false);
            setMemberAge(null);
            setMemberName('');
            setNicValidFormat(false);
            return false;
        }
        setNicValidFormat(true);
        try {
            const res = await axios.get(`${API_BASE}/certificates/citizens/check/${nicValue}`);
            if (res.data && res.data.exists) {
                const age = calculateAge(nicValue);
                setMemberAge(age);
                setMemberName(res.data.fullName || '');
                if (age !== null && age < 18) {
                    setMemberValidationMsg({ text: t.memberNotAdult, type: 'error' });
                    setMemberExists(false);
                    return false;
                } else {
                    setMemberValidationMsg({ text: t.memberRegistered, type: 'success' });
                    setMemberExists(true);
                    return true;
                }
            } else {
                setMemberValidationMsg({ text: t.memberNotRegistered, type: 'error' });
                setMemberExists(false);
                setMemberAge(null);
                setMemberName('');
                return false;
            }
        } catch (err) {
            console.error(err);
            setMemberValidationMsg({ text: t.invalidMember, type: 'error' });
            setMemberExists(false);
            return false;
        }
    }, [t]);

    // Auto-check citizen when NIC changes
    useEffect(() => {
        const checkCitizen = async () => {
            if (applyFor === 'Family' && !isChild && nic && (nic.length === 10 || nic.length === 12)) {
                await validateFamilyMember(nic);
            } else if (applyFor === 'Family' && isChild) {
                setMemberValidationMsg({ text: '', type: '' });
                setMemberExists(true);
                setMemberAge(null);
                setNicValidFormat(true);
            } else if (applyFor === 'Self') {
                setMemberValidationMsg({ text: '', type: '' });
                setMemberExists(true);
                setMemberAge(calculateAge(owner?.nic));
                setNicValidFormat(true);
            }
        };
        const timer = setTimeout(checkCitizen, 800);
        return () => clearTimeout(timer);
    }, [nic, applyFor, isChild, owner, validateFamilyMember]);

    // NIC SCANNING USING TESSERACT.JS (OCR)
    const handleNICScan = async (e, mode) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsScanning(true);
        setScanMessage({ text: t.scanning, type: 'info' });
        try {
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(file);
            const match = text.match(/(?:[0-9]{9}[vVxX]|[0-9]{12})/);
            const scannedNic = match ? match[0].toUpperCase() : null;
            if (mode === 'owner_auth') {
                if (scannedNic === owner?.nic?.toUpperCase()) {
                    setOwnerVerified(true);
                    setScanMessage({ text: t.verified, type: 'success' });
                } else {
                    setScanMessage({ text: t.notVerified, type: 'error' });
                }
            } else {
                if (scannedNic) {
                    setNic(scannedNic);
                    await validateFamilyMember(scannedNic);
                }
            }
            await worker.terminate();
        } catch (err) { setScanMessage({ text: "Scan Failed", type: 'error' }); }
        setIsScanning(false);
    };

    // PAYMENT HANDLING
    const handlePaymentSuccess = (paymentResult) => {
        if (paymentResult && paymentResult.transactionId) {
            const newPaymentData = {
                transactionId: paymentResult.transactionId,
                paymentMethod: paymentResult.paymentMethod,
                amount: paymentResult.amount,
                status: paymentResult.status,
                cardLastFour: paymentResult.cardLastFour || null,
                cardType: paymentResult.cardType || null,
                cardholderName: paymentResult.cardholderName || null,
                mobileNumber: paymentResult.mobileNumber || null,
                provider: paymentResult.provider || null,
                bankName: paymentResult.bankName || null,
                accountLastFour: paymentResult.accountLastFour || null,
                accountHolderName: paymentResult.accountHolderName || null,
                branchCode: paymentResult.branchCode || null,
                referenceNumber: paymentResult.referenceNumber || null,
                receiptNumber: paymentResult.receiptNumber || null,
                bankSlipFile: paymentResult.bankSlipFile || null
            };
            setPaymentData(newPaymentData);
            setPaymentCompleted(true);
            setShowPayment(false);
            setStatusMsg({ text: t.paymentSuccess, type: 'success' });
            submitWithPaymentData(newPaymentData);
        } else {
            setStatusMsg({ text: "Payment failed. Please try again.", type: 'error' });
            setShowPayment(false);
        }
    };

    const appendPaymentFormData = (formData, data) => {
        if (data && data.transactionId) {
            formData.append('paymentStatus', data.status === 'completed' ? 'completed' : 'pending');
            formData.append('paymentMethod', data.paymentMethod);
            formData.append('transactionId', data.transactionId);
            formData.append('paymentAmount', data.amount);

            if (data.cardLastFour) formData.append('cardLastFour', data.cardLastFour);
            if (data.cardType) formData.append('cardType', data.cardType);
            if (data.cardholderName) formData.append('cardholderName', data.cardholderName);
            if (data.mobileNumber) formData.append('mobileNumber', data.mobileNumber);
            if (data.provider) formData.append('provider', data.provider);
            if (data.bankName) formData.append('bankName', data.bankName);
            if (data.accountLastFour) formData.append('accountLastFour', data.accountLastFour);
            if (data.accountHolderName) formData.append('accountHolderName', data.accountHolderName);
            if (data.branchCode) formData.append('branchCode', data.branchCode);
            if (data.referenceNumber) formData.append('referenceNumber', data.referenceNumber);
            if (data.receiptNumber) formData.append('receiptNumber', data.receiptNumber);
            if (data.bankSlipFile) formData.append('bankSlip', data.bankSlipFile);
        } else {
            formData.append('paymentStatus', 'pending');
        }
    };

    // SUBMIT APPLICATION WITH PAYMENT DATA
    const submitWithPaymentData = async (paymentInfo) => {
        if (!selectedFile) {
            setStatusMsg({ text: t.requiredDocumentMissing, type: 'error' });
            return;
        }
        const memberNicValue = applyFor === 'Self' ? owner.nic : (isChild ? 'CHILD-NO-ID' : nic);
        if (hasDuplicateApplication(certType, memberNicValue, editId)) {
            setStatusMsg({ text: t.duplicateApplication, type: 'error' });
            return;
        }
        if (hasApprovedCertificate(certType, memberNicValue, editId)) {
            setStatusMsg({ text: t.approvedCertificateExists, type: 'error' });
            return;
        }
        setIsSubmitting(true);
        setStatusMsg({ text: t.processing, type: 'info' });
        const formData = new FormData();
        formData.append('userId', owner._id);
        formData.append('certificateType', certType);
        formData.append('applyFor', applyFor);
        formData.append('memberName', applyFor === 'Self' ? owner.fullName : memberName);
        formData.append('nic', memberNicValue);
        formData.append('relationship', applyFor === 'Self' ? 'Self' : relationship);
        formData.append('utilityBill', selectedFile);
        
        appendPaymentFormData(formData, paymentInfo);

        try {
            const url = editId 
                ? `${API_BASE}/certificates/update/${editId}` 
                : `${API_BASE}/certificates/apply`;
            await axios({ method: editId ? 'put' : 'post', url: url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
            setStatusMsg({ text: editId ? t.updateSuccess : t.submitSuccess, type: 'success' });
            setPaymentCompleted(false);
            setPaymentData(null);
            setTimeout(() => { resetForm(); fetchMyApps(); setStatusMsg({text:'', type:''}); }, 2500);
        } catch (err) {
            if (!isOnline) {
                storeOfflineApplication(formData);
                setStatusMsg({ text: t.offlineMode, type: 'info' });
            } else {
                setStatusMsg({ text: t.submitFailed + ": " + (err.response?.data?.error || err.message), type: 'error' });
            }
        }
        setIsSubmitting(false);
    };

    // Submit application (triggers payment if fee > 0)//create
    const submitApplication = async () => {
        setStatusMsg({ text: '', type: '' });
        if (!selectedFile) {
            setStatusMsg({ text: t.requiredDocumentMissing, type: 'error' });
            return;
        }
        const memberNicValue = applyFor === 'Self' ? owner.nic : (isChild ? 'CHILD-NO-ID' : nic);
        if (hasDuplicateApplication(certType, memberNicValue, editId)) {
            setStatusMsg({ text: t.duplicateApplication, type: 'error' });
            return;
        }
        if (hasApprovedCertificate(certType, memberNicValue, editId)) {
            setStatusMsg({ text: t.approvedCertificateExists, type: 'error' });
            return;
        }
        setIsSubmitting(true);
        setStatusMsg({ text: t.processing, type: 'info' });
        const formData = new FormData();
        formData.append('userId', owner._id);
        formData.append('certificateType', certType);
        formData.append('applyFor', applyFor);
        formData.append('memberName', applyFor === 'Self' ? owner.fullName : memberName);
        formData.append('nic', memberNicValue);
        formData.append('relationship', applyFor === 'Self' ? 'Self' : relationship);
        formData.append('utilityBill', selectedFile);
        
        appendPaymentFormData(formData, paymentData);

        try {
            const url = editId ? `${API_BASE}/certificates/update/${editId}` : `${API_BASE}/certificates/apply`;
            await axios({ method: editId ? 'put' : 'post', url: url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
            setStatusMsg({ text: editId ? t.updateSuccess : t.submitSuccess, type: 'success' });
            setPaymentCompleted(false);
            setPaymentData(null);
            setTimeout(() => { resetForm(); fetchMyApps(); setStatusMsg({text:'', type:''}); }, 2500);
        } catch (err) {
            if (!isOnline) {
                storeOfflineApplication(formData);
                setStatusMsg({ text: t.offlineMode, type: 'info' });
            } else {
                setStatusMsg({ text: t.submitFailed + ": " + (err.response?.data?.error || err.message), type: 'error' });
            }
        }
        setIsSubmitting(false);
    };

    const handleApply = async (e) => {
        e.preventDefault();
        const fee = calculateFee();
        if (fee > 0 && !paymentCompleted && !editId) {
            setShowPayment(true);
            return;
        }
        submitApplication();
    };

    // Edit existing application
    const handleEdit = (app) => {
        setEditId(app._id);
        setApplyFor(app.applyFor);
        setCertType(app.certificateType);
        setNic(app.nic === 'CHILD-NO-ID' ? '' : app.nic);
        setIsChild(app.nic === 'CHILD-NO-ID');
        setMemberName(app.memberName);
        setRelationship(app.relationship);
        setOwnerVerified(true);
        setSelectedFile(null);
        setFileError('');
        setPaymentCompleted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Reset form after submission
    const resetForm = () => {
        setEditId(null); setMemberName(''); setRelationship(''); setNic('');
        setSelectedFile(null); setFileError(''); setIsChild(false);
        setScanMessage({ text: '', type: '' });
        setMemberValidationMsg({ text: '', type: '' });
        setMemberExists(false); setMemberAge(null); setNicValidFormat(false);
        setPaymentCompleted(false); setPaymentData(null); setShowPayment(false);
    };

    // Resubmit rejected application
    const handleResubmit = (oldApp) => {
        setCertType(oldApp.certificateType);
        setMemberName(oldApp.memberName);
        setRelationship(oldApp.relationship);
        setApplyFor(oldApp.applyFor === 'Self' ? 'Self' : 'Family');
        setOwnerVerified(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        alert(`${t.reasonHelp}\n\n${t.rejectReason} ${oldApp.rejectionReason || 'Not specified'}`);
    };

    // Generates official certificate with QR code
    const downloadCertificate = async (app) => {
        const doc = new jsPDF();
        const verifyURL = `${window.location.origin}/verify-cert/${app._id}`;
        const qrCode = await QRCode.toDataURL(verifyURL);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        doc.setLineWidth(1.2);
        doc.rect(7, 7, 196, 283);
        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text("DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA", 105, 25, {align:'center'});
        doc.text("DEPARTMENT OF GRAMA NILADHARI ADMINISTRATION", 105, 32, {align:'center'});
        doc.setFontSize(10);
        doc.setFont("times", "italic");
        doc.text("VillageFlow Digital Governance Framework", 105, 38, {align:'center'});
        doc.setLineWidth(0.5);
        doc.line(40, 42, 170, 42);
        doc.setFont("times", "bold");
        doc.setFontSize(18);
        doc.setTextColor(128, 0, 0);
        doc.text(app.certificateType.toUpperCase(), 105, 58, {align:'center'});
        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        const bodyText = `This is to officially certify that the information provided herein has been verified against the National Citizen Database. The applicant, whose details are mentioned below, is legally recognized under the administrative jurisdiction of the Grama Niladhari Division.`;
        const splitText = doc.splitTextToSize(bodyText, 170);
        doc.text(splitText, 20, 75);
        autoTable(doc, {
            startY: 95,
            margin: { left: 20, right: 20 },
            body: [
                ['Reference Number', `: VF/CERT/${app._id.substring(0, 8).toUpperCase()}`],
                ['Full Name', `: ${app.memberName.toUpperCase()}`],
                ['National Identity Card', `: ${app.nic}`],
                ['Relationship', `: ${app.relationship}`],
                ['Issuing Authority', `: GRAMA NILADHARI OFFICE`],
                ['Certification Status', `: LEGALLY VALID & DIGITALLY SIGNED`],
                ['Date of Issuance', `: ${new Date().toLocaleDateString()}`],
                ['Digital Signature', `: VF-DS-${app._id.substring(0, 12).toUpperCase()}`]
            ],
            theme: 'plain',
            styles: { fontSize: 11, cellPadding: 5, font: "times" },
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
        });
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.addImage(qrCode, 'PNG', 20, finalY, 35, 35);
        doc.setFontSize(9);
        doc.setFont("times", "bold");
        doc.text("DIGITAL VERIFICATION SEAL", 20, finalY + 42);
        doc.setFont("times", "italic");
        doc.setFontSize(8);
        doc.text("This is a computer-generated document. No physical signature is required.", 105, finalY + 55, {align:'center'});
        doc.text("Any unauthorized alteration of this certificate will lead to legal prosecution.", 105, finalY + 60, {align:'center'});
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, finalY + 75);
        doc.text(`Document ID: VF-CERT-${app._id.substring(0, 12)}`, 20, finalY + 80);
        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.text("....................................................", 140, finalY + 30);
        doc.text("Authorized Registrar", 145, finalY + 36);
        doc.setFontSize(9);
        doc.text("(VillageFlow Digital Authority)", 143, finalY + 41);
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(60);
        doc.setFont("times", "bold");
        doc.text("OFFICIAL DOCUMENT", 105, 150, { align: 'center', angle: 45 });
        doc.restoreGraphicsState();
        doc.save(`Official_Certificate_${app.memberName}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Print certificate directly
    const printCertificate = async (app) => {
        const printWindow = window.open('', '_blank');
        const qrCode = await QRCode.toDataURL(`https://villageflow.netlify.app/verify-cert/${app._id}`);
        printWindow.document.write(`
            <html><head><title>Certificate - ${app.memberName}</title>
            <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; }
                .certificate { border: 2px solid #8B0000; padding: 30px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 1px solid #8B0000; margin-bottom: 20px; }
                .title { color: #8B0000; font-size: 24px; text-align: center; margin: 20px 0; }
                .content { margin: 20px 0; line-height: 1.6; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; }
                .qr-code { text-align: center; margin: 20px 0; }
                @media print { body { margin: 0; padding: 0; } }
            </style>
            </head>
            <body onload="window.print(); window.close();">
                <div class="certificate">
                    <div class="header"><h2>DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA</h2><p>DEPARTMENT OF GRAMA NILADHARI ADMINISTRATION</p></div>
                    <h1 class="title">${app.certificateType}</h1>
                    <div class="content">
                        <p>This is to certify that <strong>${app.memberName}</strong> (NIC: ${app.nic}) is a registered resident under the administrative jurisdiction of the Grama Niladhari Division.</p>
                        <p>Relationship: ${app.relationship}</p>
                        <p>Reference Number: VF/CERT/${app._id.substring(0, 8).toUpperCase()}</p>
                        <p>Date of Issue: ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="qr-code"><img src="${qrCode}" width="100" /><p>Scan to verify authenticity</p></div>
                    <div class="footer"><p>This is a computer-generated document. No physical signature is required.</p><p>Authorized Registrar - VillageFlow Digital Authority</p></div>
                </div>
            </body></html>
        `);
        printWindow.document.close();
    };

    const isFormValid = () => {
        if (applyFor === 'Family' && !isChild) {
            return memberExists && memberAge >= 18 && relationship && nic && nicValidFormat;
        }
        if (applyFor === 'Family' && isChild) {
            return memberName && relationship;
        }
        return true;
    };

    const fee = calculateFee();
    const showFeeInfo = fee > 0 && !editId && !paymentCompleted;


    // UI RENDER
    
    return (
        <div className="member2-certificates" style={styles.pageContent}>
            <OfflineStatusBar isOnline={isOnline} pendingSyncCount={pendingSyncCount} lang={lang} />
            {showPayment && (<PaymentModal amount={fee} certType={certType} onSuccess={handlePaymentSuccess} onCancel={() => setShowPayment(false)} lang={lang} />)}
            <div style={styles.headerContainer}>
                <div className="header-row" style={styles.headerRow}>
                    <div className="logo-group" style={styles.logoGroup}>
                        <Landmark color="#f2b713" size={32} strokeWidth={1.5} />
                        <div style={styles.titleContainer}>
                            <h1 className="main-title" style={styles.mainTitle}>GOVERNMENT OF SRI LANKA</h1>
                            <p className="sub-title" style={styles.subTitle}>VillageFlow Identity System</p>
                        </div>
                    </div>
                    <div className="right-actions" style={styles.rightActions}>
                        {!isOnline && <div style={styles.offlineBadge}><WifiOff size={14}/> Offline</div>}
                    </div>
                </div>
                <div style={styles.bottomBar}></div>
            </div>
            {myApplications.some(app => app.status === 'Pending') && (
                <div className="live-bar" style={styles.liveBar}>
                    <div style={styles.pulseContainer}><div style={styles.pulse}></div><Activity size={20} /></div>
                    <span><b>{t.liveUpdate}</b> {t.liveMessage}</span>
                </div>
            )}
            <div className="grid" style={styles.grid}>
                {/* Left Panel - Application Form */}
                <div className="member2-main-card card" style={styles.card}>
                    <h2 className="card-title" style={styles.cardTitle}>
                        <div style={styles.titleIcon}><ShieldCheck size={22} color="white" /></div>
                        {editId ? t.editApplication : t.lock}
                    </h2>
                    {!ownerVerified && !editId ? (
                        <div className="auth-zone" style={styles.authZone}>
                            <div style={styles.scanIllustration}><Camera size={40} color="#8B0000" /></div>
                            <p style={styles.authText}>{t.scanOwner}</p>
                            <label className="primary-scan-btn" style={styles.primaryScanBtn}>
                                <Upload size={18} /> {t.scanProfileNIC}
                                <input type="file" onChange={(e)=>handleNICScan(e, 'owner_auth')} style={{display:'none'}} />
                            </label>
                            {isScanning && <div style={styles.scanLoader}><Loader2 className="animate-spin" /> {t.scanning}</div>}
                        </div>
                    ) : (
                        <form onSubmit={handleApply} style={styles.formContent}>
                            <div className="tab-group" style={styles.tabGroup}>
                                <button type="button" onClick={()=>{ setApplyFor('Self'); setMemberName(owner.fullName); setNic(owner.nic); setRelationship('Self'); setMemberValidationMsg({ text: '', type: '' }); setMemberExists(true); setNicValidFormat(true); setPaymentCompleted(false); setPaymentData(null); }} className={applyFor==='Self' ? 'tab-active' : 'tab'} style={applyFor==='Self'?styles.tabActive:styles.tab}>
                                    <User size={16}/> {t.self}
                                </button>
                                <button type="button" onClick={()=>{ setApplyFor('Family'); setMemberName(''); setRelationship(''); setMemberValidationMsg({ text: '', type: '' }); setMemberExists(false); setNicValidFormat(false); setPaymentCompleted(false); setPaymentData(null); }} className={applyFor==='Family' ? 'tab-active' : 'tab'} style={applyFor==='Family'?styles.tabActive:styles.tab}>
                                    <Users size={16}/> {t.family}
                                </button>
                            </div>
                            <div style={styles.inputGroup}>
                                <label className="field-label" style={styles.fieldLabel}>{t.certType}</label>
                                <select className="select-field" style={styles.selectField} value={certType} onChange={(e)=>setCertType(e.target.value)}>
                                    <option value="Residency Certificate">{t.certificateTypes.residency}</option>
                                    <option value="Character Certificate">{t.certificateTypes.character}</option>
                                    <option value="Income Certificate">{t.certificateTypes.income}</option>
                                    <option value="Birth Certificate Copy">{t.certificateTypes.birth}</option>
                                </select>
                            </div>
                            {showFeeInfo && (<div style={styles.feeInfo}><CreditCard size={16} color="#f59e0b" /><span>{t.fee}: <strong>Rs. {fee}/=</strong></span></div>)}
                            {applyFor === 'Family' && (
                                <div className="family-panel" style={styles.familyPanel}>
                                    <label style={styles.checkRow}>
                                        <input type="checkbox" style={styles.checkbox} checked={isChild} onChange={(e)=>{ setIsChild(e.target.checked); if (e.target.checked) { setMemberValidationMsg({ text: '', type: '' }); setMemberExists(true); setNicValidFormat(true); } else { setMemberExists(false); setNicValidFormat(false); if (nic) validateFamilyMember(nic); } }} /> {t.child}
                                    </label>
                                    {!isChild && (
                                        <div style={styles.inputWrapper}>
                                            <input className="input-field" style={{...styles.inputField, borderColor: memberValidationMsg.type === 'success' ? '#10b981' : (memberValidationMsg.type === 'error' ? '#ef4444' : '#e2e8f0')}} placeholder={t.memberNIC} value={nic} onChange={(e)=>setNic(e.target.value)} />
                                            <label style={styles.miniScan}><Camera size={18}/><input type="file" onChange={(e)=>handleNICScan(e, 'member_check')} style={{display:'none'}}/></label>
                                        </div>
                                    )}
                                    {memberValidationMsg.text && (
                                        <div style={{...styles.memberValidationMsg, background: memberValidationMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${memberValidationMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`}}>
                                            {memberValidationMsg.type === 'success' ? <CheckCircle2 size={14} color="#10b981" /> : <AlertCircle size={14} color="#ef4444" />}
                                            <span style={{color: memberValidationMsg.type === 'success' ? '#166534' : '#991b1b'}}>{memberValidationMsg.text}</span>
                                        </div>
                                    )}
                                    {(!isChild && memberExists && memberAge !== null && memberAge >= 18) && (
                                        <div style={styles.memberDetailsCard}>
                                            <div style={styles.memberDetailsHeader}><User size={16} color="#8B0000" /><span style={{fontWeight: '600'}}>{t.memberDetails}</span></div>
                                            <div style={styles.memberDetailRow}><span style={{fontWeight: '500'}}>{t.fullName}:</span><span>{memberName}</span></div>
                                            <div style={styles.memberDetailRow}><span style={{fontWeight: '500'}}>{t.ageRestriction}:</span><span>{memberAge} years {memberAge >= 65 ? '(Free Fee)' : '(Eligible)'}</span></div>
                                        </div>
                                    )}
                                    <div style={styles.inputGroup}>
                                        <label className="field-label" style={styles.fieldLabel}>{t.relationship}</label>
                                        <select className="select-field" style={styles.selectField} value={relationship} onChange={(e)=>setRelationship(e.target.value)} required={applyFor === 'Family'}>
                                            <option value="">{t.selectRelationship}</option>
                                            <option value="Husband">{t.relationshipOptions.husband}</option>
                                            <option value="Wife">{t.relationshipOptions.wife}</option>
                                            <option value="Mother">{t.relationshipOptions.mother}</option>
                                            <option value="Father">{t.relationshipOptions.father}</option>
                                            <option value="Child">{t.relationshipOptions.child}</option>
                                            <option value="Sibling">{t.relationshipOptions.sibling}</option>
                                            <option value="Grandmother">{t.relationshipOptions.grandmother}</option>
                                            <option value="Grandfather">{t.relationshipOptions.grandfather}</option>
                                        </select>
                                    </div>
                                    <input className="input-field" style={styles.inputField} placeholder={t.fullName} value={memberName} onChange={(e)=>setMemberName(e.target.value)} required={applyFor === 'Family'} />
                                </div>
                            )}
                            <div className="upload-section" style={styles.uploadSection}>
                                <label style={styles.fieldLabel}>{t.requiredDocs}</label>
                                <div className="upload-strip" style={{...styles.uploadStrip, borderColor: statusMsg.text === t.requiredDocumentMissing ? '#ef4444' : '#cbd5e1', backgroundColor: statusMsg.text === t.requiredDocumentMissing ? '#fef2f2' : 'white'}}>
                                    <Upload size={18} color="#8B0000" />
                                    <span style={{fontSize:'13px', fontWeight:'500', color: selectedFile ? '#1e293b' : '#94a3b8'}}>{selectedFile ? selectedFile.name : t.proofAddress}</span>
                                    <input type="file" onChange={handleFileChange} style={styles.fileOverlay} accept="image/jpeg,image/jpg,image/png,application/pdf" />
                                </div>
                                {fileError && (<div style={styles.fileErrorMsg}><AlertCircle size={12} color="#ef4444" /><span>{fileError}</span></div>)}
                                {statusMsg.text === t.requiredDocumentMissing && (<div style={styles.requiredDocError}><AlertCircle size={12} color="#ef4444" /><span>{t.requiredDocumentMissing}</span></div>)}
                            </div>
                            {selectedFile && (<DocumentPreview file={selectedFile} onClear={() => setSelectedFile(null)} lang={lang} />)}
                            {statusMsg.text && statusMsg.text !== t.requiredDocumentMissing && (
                                <div style={{...styles.statusBox, background: statusMsg.type==='success'?'#effaf3':(statusMsg.type==='info'?'#eff6ff':'#fff5f5'), border: `1px solid ${statusMsg.type==='success'?'#34d399':(statusMsg.type==='info'?'#3b82f6':'#f87171')}`}}>
                                    {statusMsg.type==='success'?<CheckCircle2 size={18} color="#059669"/>:statusMsg.type==='info'?<RefreshCw size={18} color="#2563eb"/>:<AlertCircle size={18} color="#dc2626"/>}
                                    <span style={{color: statusMsg.type==='success'?'#065f46':(statusMsg.type==='info'?'#1e40af':'#991b1b')}}>{statusMsg.text}</span>
                                </div>
                            )}
                            <div style={styles.btnRow}>
                                <button type="submit" className="submit-btn" style={{...styles.submitBtn, opacity: isFormValid() ? 1 : 0.6, cursor: isFormValid() ? 'pointer' : 'not-allowed'}} disabled={isSubmitting || !isFormValid()}>
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (editId ? t.update : (showFeeInfo ? `${t.payNow} (Rs. ${fee})` : t.submit))}
                                </button>
                                {editId && <button type="button" onClick={resetForm} style={styles.cancelBtn}>{t.cancel}</button>}
                            </div>
                        </form>
                    )}
                    {scanMessage.text && <div style={{...styles.scanResult, background: scanMessage.type==='error'?'#fef2f2':'#f0fdf4', color: scanMessage.type==='error'?'#dc2626':'#16a34a'}}>
                        {scanMessage.type==='error' ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>} {scanMessage.text}
                    </div>}
                </div>

                {/* Right Panel - Application History */}
                <div className="member2-main-card card" style={styles.card}>
                    <h3 className="card-title" style={styles.cardTitle}><div style={styles.titleIcon}><Clock size={20} color="white" /></div> {t.history}</h3>
                    <div style={styles.historyBox}>
                        {myApplications.length === 0 ? (
                            <div style={styles.noData}><Info size={40} color="#cbd5e1" /><p>{t.noApps}</p></div>
                        ) : (
                            myApplications.map(app => (
                                <div key={app._id} className="history-item-professional" style={styles.historyItemProfessional}>
                                    <div className="app-header" style={styles.appHeader}>
                                        <div>
                                            <div className="app-name" style={styles.appName}>{app.memberName}</div>
                                            <div className="app-meta" style={styles.appMeta}>{app.certificateType}</div>
                                            {app.relationship !== 'Self' && (<div className="relation-badge" style={styles.relationBadge}>{app.relationship}</div>)}
                                        </div>
                                        <div className="app-date" style={styles.appDate}>{new Date(app.appliedDate).toLocaleDateString()}</div>
                                    </div>
                                    <StatusTracker status={app.status} lang={lang} />
                                    {app.status === 'Rejected' && app.rejectionReason && (
                                        <div style={styles.rejectionNotice}>
                                            <AlertCircle size={14} />
                                            <div style={{flex: 1}}>
                                                <span><b>{t.rejectReason}</b> {app.rejectionReason}</span>
                                                <button onClick={() => handleResubmit(app)} style={styles.resubmitBtn}><RefreshCw size={12}/> {t.resubmit}</button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="member2-action-row" style={styles.actionRowProfessional}>
                                        {app.status === 'Pending' && (
                                            <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                                                <button onClick={()=>handleEdit(app)} style={styles.editBtnProfessional}><Edit3 size={16}/> {t.update}</button>
                                                <button onClick={async() => {if(window.confirm(t.deleteConfirm)) {await axios.delete(`${API_BASE}/certificates/delete/${app._id}`); fetchMyApps();}}} style={styles.deleteBtnProfessional}><Trash2 size={16}/></button>
                                            </div>
                                        )}
                                        {app.status === 'Approved' && (
                                            <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                                                <button className="member2-primary-action-btn" onClick={()=>downloadCertificate(app)} style={styles.pdfBtnProfessional}><Download size={16}/> {t.downloadCert}</button>
                                                <button className="member2-secondary-action-btn" onClick={()=>printCertificate(app)} style={styles.printBtnProfessional}><Printer size={16}/> {t.print}</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Responsive CSS */}
            <style>{`
                @keyframes pulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .member2-certificates .header-row { flex-direction: column !important; gap: 15px !important; padding: 15px 20px !important; }
                    .member2-certificates .logo-group { justify-content: center !important; }
                    .member2-certificates .main-title { font-size: 16px !important; }
                    .member2-certificates .member2-main-card { padding: 18px !important; border-radius: 16px !important; }
                    .member2-certificates .member2-action-row { justify-content: stretch !important; }
                    .member2-certificates .member2-action-row > div { width: 100% !important; }
                    .member2-certificates .member2-primary-action-btn, .member2-certificates .member2-secondary-action-btn { flex: 1 1 auto !important; justify-content: center !important; }
                    .member2-certificates .sub-title { font-size: 10px !important; }
                    .member2-certificates .grid { grid-template-columns: 1fr !important; padding: 0 20px !important; gap: 20px !important; }
                    .member2-certificates .card { padding: 20px !important; }
                    .member2-certificates .card-title { font-size: 18px !important; margin-bottom: 20px !important; }
                    .member2-certificates .tab-group { margin-bottom: 20px !important; }
                    .member2-certificates .tab, .member2-certificates .tab-active { padding: 10px !important; font-size: 13px !important; }
                    .member2-certificates .select-field, .member2-certificates .input-field { padding: 12px !important; font-size: 14px !important; }
                    .member2-certificates .family-panel { padding: 15px !important; }
                    .member2-certificates .upload-strip { padding: 12px !important; }
                    .member2-certificates .submit-btn { padding: 14px !important; font-size: 14px !important; }
                    .member2-certificates .history-item-professional { padding: 15px !important; }
                    .member2-certificates .app-header { flex-direction: column !important; gap: 10px !important; }
                    .member2-certificates .action-row-professional { flex-direction: column !important; }
                    .member2-certificates .pdf-btn-professional, .member2-certificates .print-btn-professional, .member2-certificates .share-btn-professional, .member2-certificates .edit-btn-professional, .member2-certificates .delete-btn-professional { width: 100% !important; justify-content: center !important; padding: 10px !important; }
                    .member2-certificates .tracker-wrapper { flex-wrap: wrap !important; justify-content: center !important; gap: 10px !important; }
                    .member2-certificates .step-container { flex-direction: row !important; gap: 8px !important; }
                    .member2-certificates .step-line { display: none !important; }
                    .member2-certificates .live-bar { margin: 15px 20px !important; padding: 12px 15px !important; font-size: 12px !important; }
                    .member2-certificates .right-actions { justify-content: center !important; }
                    .member2-certificates .modal-content { width: 95% !important; margin: 10px !important; }
                    .member2-certificates .payment-methods-container { gap: 10px !important; }
                    .member2-certificates .payment-method-card { padding: 12px !important; }
                    .member2-certificates .payment-method-icon { width: 40px !important; height: 40px !important; }
                    .member2-certificates .row-two-cols { grid-template-columns: 1fr !important; gap: 10px !important; }
                }
                @media (max-width: 480px) {
                    .member2-certificates .card { padding: 15px !important; }
                    .member2-certificates .card-title { font-size: 16px !important; }
                    .member2-certificates .tab, .member2-certificates .tab-active { font-size: 12px !important; padding: 8px !important; }
                    .member2-certificates .select-field, .member2-certificates .input-field { padding: 10px !important; font-size: 13px !important; }
                    .member2-certificates .field-label { font-size: 12px !important; }
                    .member2-certificates .submit-btn { padding: 12px !important; font-size: 13px !important; }
                    .member2-certificates .app-name { font-size: 14px !important; }
                    .member2-certificates .app-meta { font-size: 11px !important; }
                    .member2-certificates .app-date { font-size: 10px !important; }
                    .member2-certificates .relation-badge { font-size: 10px !important; }
                    .member2-certificates .auth-zone { padding: 30px 15px !important; }
                    .member2-certificates .primary-scan-btn { padding: 12px 20px !important; font-size: 12px !important; }
                }
                @media (min-width: 769px) {
                    .member2-certificates .grid { grid-template-columns: 1fr 1fr !important; padding: 0 50px !important; }
                    .member2-certificates .header-row { flex-direction: row !important; padding: 15px 40px !important; }
                }
                .member2-certificates .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(128,0,0,0.3); }
                .member2-certificates .pdf-btn-professional:hover, .member2-certificates .print-btn-professional:hover, .member2-certificates .share-btn-professional:hover, .member2-certificates .edit-btn-professional:hover, .member2-certificates .delete-btn-professional:hover { transform: translateY(-2px); opacity: 0.9; }
                .member2-certificates .upload-strip:hover { background-color: #f8fafc !important; border-color: #8B0000 !important; }
            `}</style>
        </div>
    );
}

// STYLES OBJECT

const styles = {
    pageContent: { padding: '0', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    offlineBar: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '8px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', justifyContent: 'center' },
    offlineBadge: { display: 'flex', alignItems: 'center', gap: '5px', background: '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '24px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#8B0000', color: 'white' },
    modalClose: { background: 'none', border: 'none', color: 'white', cursor: 'pointer' },
    modalBody: { padding: '20px' },
    modalFooter: { padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' },
    paymentAmount: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px' },
    paymentMethodsContainer: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' },
    paymentMethodCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: '2px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' },
    paymentMethodIcon: { width: '48px', height: '48px', background: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cardTypeSelector: { display: 'flex', gap: '10px', marginBottom: '20px' },
    cardTypeBtn: { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
    providerSelector: { display: 'flex', gap: '10px', marginBottom: '20px' },
    providerBtn: { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
    rowTwoCols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    bankInfoBox: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: '#fef3c7', borderRadius: '12px', marginBottom: '20px' },
    bankInfoText: { fontSize: '12px', margin: '2px 0', color: '#475569' },
    bankDetailsDisplay: { marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' },
    bankDetailsHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' },
    bankDetailRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' },
    offlinePaymentBox: { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: '#e0f2fe', borderRadius: '12px', marginBottom: '20px' },
    offlineInfoBox: { marginTop: '20px', padding: '15px', background: '#fef3c7', borderRadius: '12px', borderLeft: '4px solid #f59e0b' },
    paymentInfoNote: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#eff6ff', borderRadius: '8px', fontSize: '12px', color: '#1e40af', marginTop: '15px' },
    receiptContainer: { textAlign: 'center' },
    receiptSuccessIcon: { marginBottom: '15px' },
    receiptTitle: { fontSize: '18px', color: '#10b981', marginBottom: '20px' },
    receiptDetails: { background: '#f8fafc', borderRadius: '12px', padding: '15px', textAlign: 'left', marginBottom: '20px' },
    receiptRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: '14px' },
    downloadReceiptBtn: { width: '100%', padding: '12px', background: '#475569', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    errorText: { fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' },
    paymentBtn: { flex: 1, background: 'linear-gradient(135deg, #8B0000 0%, #a00000 100%)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    cancelPaymentBtn: { padding: '14px 24px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer' },
    previewContainer: { marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' },
    previewHeader: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600' },
    previewRemoveBtn: { marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' },
    previewContent: { padding: '15px', textAlign: 'center' },
    previewImage: { maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' },
    pdfPreview: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px' },
    fileInfo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' },
    feeInfo: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: '#fef3c7', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' },
    resubmitBtn: { background: '#f59e0b', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', marginLeft: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
    printBtnProfessional: { background: '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
    headerContainer: { background: '#8B0000', marginBottom: '30px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', color: 'white' },
    logoGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
    titleContainer: {},
    mainTitle: { fontSize: '20px', margin: 0, fontWeight: '800', letterSpacing: '0.5px', color: '#f2b713' },
    subTitle: { fontSize: '13px', margin: '2px 0 0 0', opacity: 0.9, color: 'white' },
    rightActions: { display: 'flex', alignItems: 'center', gap: '15px' },
    langBar: { display: 'flex', gap: '5px', alignItems: 'center' },
    langBtn: { padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'white', opacity: 0.7 },
    langActive: { padding: '8px 12px', border: 'none', background: 'none', color: '#f2b713', fontSize: '13px', fontWeight: '800' },
    separator: { color: 'white', opacity: 0.3 },
    bottomBar: { height: '4px', background: '#f2b713' },
    liveBar: { background: '#1e293b', color: 'white', padding: '15px 25px', borderRadius: '15px', margin: '20px 50px 25px 50px', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px', borderLeft: '6px solid #f2b713' },
    pulseContainer: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    pulse: { position: 'absolute', width: '25px', height: '25px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', padding: '0 50px' },
    card: { background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(15,23,42,0.07)', height: 'fit-content', border: '1px solid #e2e8f0' },
    cardTitle: { display: 'flex', alignItems: 'center', gap: '15px', fontSize: '20px', color: '#1e293b', marginBottom: '30px', fontWeight: '700' },
    titleIcon: { background: '#8B0000', padding: '8px', borderRadius: '10px', display: 'flex' },
    authZone: { padding: '60px 20px', border: '2px dashed #cbd5e1', borderRadius: '25px', textAlign: 'center', background: '#f8fafc' },
    scanIllustration: { width: '80px', height: '80px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' },
    authText: { color: '#475569', marginBottom: '25px', fontWeight: '500' },
    primaryScanBtn: { background: '#8B0000', color: 'white', padding: '16px 32px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', border: 'none' },
    scanLoader: { marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#8B0000', fontWeight: '600' },
    tabGroup: { display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '16px', marginBottom: '30px' },
    tab: { flex: 1, padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', color: '#64748b', background: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    tabActive: { flex: 1, padding: '12px', border: 'none', borderRadius: '12px', background: 'white', color: '#8B0000', fontWeight: '800', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    inputGroup: { marginBottom: '20px' },
    fieldLabel: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '10px' },
    selectField: { width: '100%', padding: '15px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#fcfdfe', outline: 'none', fontSize: '14px' },
    familyPanel: { background: '#f8fafc', padding: '25px', borderRadius: '20px', border: '1.5px solid #e2e8f0', marginBottom: '20px' },
    inputWrapper: { position: 'relative', marginBottom: '15px' },
    inputField: { width: '100%', padding: '15px', borderRadius: '14px', border: '1.5px solid #e2e8f0', outline: 'none', boxSizing: 'border-box', marginBottom: '15px', fontSize: '14px' },
    miniScan: { position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: '#8B0000' },
    checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
    checkRow: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', marginBottom: '20px', fontWeight: '600' },
    memberValidationMsg: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', borderRadius: '10px', marginBottom: '15px', fontSize: '13px' },
    memberDetailsCard: { background: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #e2e8f0' },
    memberDetailsHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' },
    memberDetailRow: { display: 'flex', gap: '10px', fontSize: '13px', marginBottom: '6px' },
    relationBadge: { fontSize: '11px', color: '#8B0000', background: '#fff5f5', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '5px' },
    uploadSection: { marginBottom: '30px' },
    uploadStrip: { display: 'flex', alignItems: 'center', gap: '15px', padding: '18px', border: '1.5px dashed #cbd5e1', borderRadius: '14px', position: 'relative', transition: 'all 0.2s' },
    fileOverlay: { position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' },
    fileErrorMsg: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: '#ef4444' },
    requiredDocError: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', color: '#ef4444', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #ef4444' },
    btnRow: { display: 'flex', flexDirection: 'column', gap: '10px' },
    submitBtn: { width: '100%', padding: '18px', background: 'linear-gradient(135deg, #8B0000 0%, #a00000 100%)', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: '800', fontSize: '16px', boxShadow: '0 8px 20px rgba(128,0,0,0.2)' },
    cancelBtn: { width: '100%', padding: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '700' },
    statusBox: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '14px', fontSize: '14px', marginBottom: '20px' },
    scanResult: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', fontSize: '13px', marginTop: '20px', fontWeight: '600' },
    historyBox: { display: 'flex', flexDirection: 'column', gap: '20px' },
    historyItemProfessional: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },
    appHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    appName: { fontSize: '16px', fontWeight: '700', color: '#1e293b' },
    appMeta: { fontSize: '13px', color: '#64748b' },
    appDate: { fontSize: '12px', color: '#94a3b8', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' },
    trackerWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' },
    stepContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 },
    stepCircle: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' },
    stepLabel: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    stepLine: { flex: 1, height: '3px', margin: '0 -15px', marginBottom: '22px', transition: '0.3s' },
    rejectionNotice: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#fef2f2', borderRadius: '12px', color: '#dc2626', fontSize: '13px', border: '1px solid #fee2e2' },
    actionRowProfessional: { display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #e2e8f0' },
    pdfBtnProfessional: { background: '#8B0000', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
    editBtnProfessional: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
    deleteBtnProfessional: { background: '#fff1f2', color: '#e11d48', border: 'none', padding: '10px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
    noData: { textAlign: 'center', color: '#94a3b8', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' },
    cardTypeIndicator: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', background: '#f0fdf4', borderRadius: '10px', marginBottom: '15px', fontSize: '13px', color: '#166534', border: '1px solid #bbf7d0' },
    demoHint: { fontSize: '10px', color: '#94a3b8', marginTop: '4px', display: 'block' },
    demoNote: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#fef3c7', borderRadius: '10px', fontSize: '12px', color: '#92400e', marginTop: '15px' }
};

export default Member2Certificates;