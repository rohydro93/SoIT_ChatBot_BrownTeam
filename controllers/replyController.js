const fuzz = require('fuzzball');
const { responses, locations, INTENT, LANGUAGE } = require('../data/database');
const { get, add } = require('lodash');

// Generic misunderstanding responses
const ENG_ERROR_STATEMENTS = [
    "Sorry, I didn't quite catch that. Could you try asking in a different way?",
    "I'm having trouble understanding. Would you mind rephrasing your question?",
    "I'm a bit confused by that one. Can you ask it another way, please?"
];

// Filipino error statements
const FIL_ERROR_STATEMENTS = [
    "Pasensya na, medyo hindi ko po gaanong naintindihan ang tanong. Maaari po ba ninyong ipaliwanag o itanong muli sa ibang paraan?",
    "Pasensya na, nahirapan po akong maintindihan ang tanong. Maaari po ba ninyong ulitin o linawin nang kaunti?",
    "Medyo nalito po ako sa tanong ninyo. Maaari po ba ninyong ipaliwanag ito sa ibang paraan?"
];

const FIL_COMMON_PATTERNS = [
    'ano', 'sino', 'saan', 'paano', 'anong', 'sinong', 'saang', 'paanong', 'kailan', 'kailangang',
    'po', 'opo', 'natanggap', 'matanggap', 'mga', 'salamat', 'tulong', 'presyo', 'libre', 'libreng', 'bayad', 'bukas', 'sarado', 'oras',
    'kumusta',
    'kurso', 'martikula', 'admisyon', 'pag enroll', 'pag-enroll', 'enroll', 'mag-enroll', 'mag enroll', 'mag-apply', 'mag apply', 'apply',
    'pag', 'mag', 'nag', 'namamahala', 'guro', 'titser', 'eskwela', 'paaralan', 'kolehiyo', 'punong-guro', 'panukalan',
    'kompyuter', 'teknolohiya', 'teknikal', 'siyensiya', 'agham', 'matematika', 'kamusta', 'hoy', 'oy', 'huy', 'uy', 'kamusta ka', 'kumusta ka',
    'asosado', 'dekano', 'kurikulum', 'pwede', 'puede'
];

const ENG_COMMON_PATTERNS = [
    'what', 'who', 'where', 'how', 'which', 'when', 'please', 'thank', 'help', 'price', 'free', 'open', 'close', 'hours',
    'course', 'tuition', 'admission', 'enroll', 'apply', 'school', 'college', 'principal', 'curriculum',
    'computer', 'technology', 'technical', 'science', 'math', 'hello', 'hi', 'hey'
];

const suffix = "&nbsp;<i class='bx bx-link-external'></i></a>"; // External link icon

function detectLanguage(text) {
    if (!text) return LANGUAGE.ENGLISH;
    const fil = FIL_COMMON_PATTERNS.filter(r => r.test(text)).length;
    const eng = ENG_COMMON_PATTERNS.filter(r => r.test(text)).length;
    if (fil > eng && fil > 0) return LANGUAGE.FILIPINO;
    return LANGUAGE.ENGLISH;
}

// Build WhitePages URL helper
function buildWhitePagesURL(firstName, lastName, location, role, title) {
    return `https://whitepages.ivytech.edu/?first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&userid=&location=${encodeURIComponent(location)}&role=${encodeURIComponent(role)}&title=${encodeURIComponent(title)}&bee_syrup_tun=&submit=+Search+`;
}

function getErrorResponse(language = LANGUAGE.ENGLISH) {
    const index = Math.floor(Math.random() * 3);
    return language === LANGUAGE.FILIPINO ? FIL_ERROR_STATEMENTS[index] : ENG_ERROR_STATEMENTS[index];
}
function getAddressResponse(locIdx, language = LANGUAGE.ENGLISH) {
    console.log('Getting address response for location index:', locIdx);
    let response = '';
    if (locIdx > -1) {
        console.log("Matched location title:", locations[locIdx].title);
        response = `<strong>${locations[locIdx].title} Campus Location:</strong><br>`;
        response += locations[locIdx].address;
        response += `<br><a href='https://www.ivytech.edu/${locations[locIdx].url}' target='_blank'>Campus Page</a>`;
        response += `<br><a href='https://www.google.com/maps/search/?api=1&query=${locations[locIdx].position.lat},${locations[locIdx].position.lng}' target='_blank'>Google Maps</a>`;
    } else {
        response = language === LANGUAGE.FILIPINO
            ? "Kaya kong hanapin iyon para sa iyo. Aling campus ang gusto mong address?"
            : "I can look that up for you. Which campus do you want the address of?";
    }
    return response;
}

function getPhoneResponse(locIdx, language = LANGUAGE.ENGLISH) {
    let response = '';
    if (locIdx > -1) {
        response = `<strong>${locations[locIdx].title} Campus Contact Info:</strong><br><br>`;
        response += `<i class='bx bxs-phone-call'></i>&nbsp;&nbsp;<a href='tel:${locations[locIdx].phone}'>${locations[locIdx].phone}</a><br>`;
        response += `<i class='bx bxs-envelope' ></i>&nbsp;&nbsp;<a href="mailto:${locations[locIdx].email}">${locations[locIdx].email}</a>`;
        response += `<br><a href='https://www.ivytech.edu/${locations[locIdx].url}' target='_blank'>Campus Page${suffix}`;
    } else {
        response = language === LANGUAGE.FILIPINO
            ? "Aling campus ang tinutukoy mo? O gusto mo ba ang 24 oras na toll-free na numero?"
            : "Which campus are you talking about? Or would you like the 24 hour toll free number?";
    }
    return response;
}

function getDeanResponse(locIdx, language = LANGUAGE.ENGLISH) {
    let response = '';
    if (locIdx > -1) {
        let deanResponse = responses.find(r => r.intent === INTENT.DEAN_INFO);
        deanResponse = language === LANGUAGE.FILIPINO ? (deanResponse.reply.fil || deanResponse.reply.en) : (deanResponse.reply.en || deanResponse.reply.fil);
        response = `<strong>${deanResponse}</strong><br>`;
        response += `<br><a href='${buildWhitePagesURL('', '', locations[locIdx].title, 'faculty', 'Dean')}' target='_blank'>White Pages&nbsp;<i class='bx bx-link-external'></i></a>`;
        return response;
    } else {
        response = language === LANGUAGE.FILIPINO
            ? 'Hmm.. aling kampus ang gusto mong impormasyon tungkol sa dean? Maaari ka ring sundan ang link na ito para maghanap sa White Pages para sa dean: '
            : 'Hmm.. which campus are you wanting dean information for? You can also follow this link to search the White Pages for the dean: ';
        response += '<a href="' + buildWhitePagesURL('', '', '', 'faculty', 'Dean') + '" target="_blank">White Pages</a>';
    }
    return response;
}

function getResponseReply(matchedResponse, language = LANGUAGE.ENGLISH) {
    if (!matchedResponse) return null;
    response = language === LANGUAGE.FILIPINO ? (matchedResponse.reply.fil || matchedResponse.reply.en) : (matchedResponse.reply.en || matchedResponse.reply.fil);
    if (matchedResponse.url) {
        response += `<br><br><a href='${matchedResponse.url}' target='_blank'>${matchedResponse.link}${suffix}`;
    }
    return response;
}

function buildResponse(matchedResponse, language = LANGUAGE.ENGLISH, opts = {}) {
    const locIdx = opts.locIdx || null;
    const session = opts.session || null;

    if (!matchedResponse && !session)
        return getErrorResponse(language);

    let intent = matchedResponse ? matchedResponse.intent : session.currentIntent;
    if (!intent) 
        intent = INTENT.UNKNOWN;

    console.log('Building response for intent:', intent);
    console.log('Location index for response:', locIdx);
    console.log('Language for response:', language);
    console.log('Matched response object:', matchedResponse);
    console.log('Session data:', session);

    switch (intent) {
        case INTENT.ADDRESS_INFO:
            return getAddressResponse(locIdx, language);
        case INTENT.PHONE_NUMBER_INFO:
            return getPhoneResponse(locIdx, language);
        case INTENT.DEAN_INFO:
            return getDeanResponse(locIdx, language);
        default:
            if (matchedResponse) {
                return getResponseReply(matchedResponse, language);
            }
            return getErrorResponse(language); 
        } 
}

function isErrorResponse(response, language = LANGUAGE.ENGLISH) {
    const errorStatements = language === LANGUAGE.FILIPINO ? FIL_ERROR_STATEMENTS : ENG_ERROR_STATEMENTS;
    return errorStatements.includes(response);
}

module.exports = {
    detectLanguage,
    getAddressResponse,
    getPhoneResponse,
    getDeanResponse,
    buildResponse,
    getErrorResponse,
    isErrorResponse,
    LANGUAGE
};