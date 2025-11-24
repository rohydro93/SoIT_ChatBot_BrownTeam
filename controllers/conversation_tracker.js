const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/chat_session_logging.json'); // Creates a JSON file to store conversations

// Function to log conversations
function addConversation(ticket, userType, schoolEmail, from, message, intent, originalPrompt, isFilipino, botFilipinoResponse) {
    let conversations = [];
    if (fs.existsSync(filePath)) {
        conversations = JSON.parse(fs.readFileSync(filePath));
    }

    let convo = conversations.find(c => c.ticket === ticket);
    
    // Create new empty conversation
    if (!convo) {
        convo = {
            ticket,
            userType,
            schoolEmail,
            conversation: [],
            date: new Date().toISOString(),
            currentIntent: intent
        };
        conversations.push(convo);
    }
    
    // Update current intent if provided
    convo.currentIntent = intent || convo.currentIntent;

    // Build message object
    let msgObj = {
        from,
        message,
        currentIntent: convo.currentIntent
    }

    // Language handling
    if (isFilipino && from === 'user' && originalPrompt) {
        msgObj.message = `Original: ${originalPrompt} | Translated: ${message}`;
        msgObj.isFilipino = true;
    }

    if (isFilipino && from === 'bot' && botFilipinoResponse) {
        msgObj.message = `Original: ${botFilipinoResponse} | Translated: ${message}`;
        msgObj.isFilipino = true;
    }

    // Add message
    convo.conversation.push(msgObj);

    // Save file
    fs.writeFileSync(filePath, JSON.stringify(conversations, null, 2));
}

function getConversation(ticket) {
    if (!fs.existsSync(filePath)) return null;
    const conversations = JSON.parse(fs.readFileSync(filePath));
    return conversations.find(c => c.ticket === ticket) || null;
}

module.exports = {
    addConversation,
    getConversation
};
