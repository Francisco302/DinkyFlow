/**
 * Parser for execution instructions in AI responses
 * Detects and extracts execution instructions from chat messages
 */

/**
 * Parses execution instructions from a message
 * @param {string} content - Message content
 * @returns {Array|null} Array of execution instructions or null if none found
 */
export const parseExecutionInstructions = (content) => {
    if (!content || typeof content !== 'string') {
        return null;
    }

    // Look for <ejecutar>...</ejecutar> tags
    const ejecutarRegex = /<ejecutar>([\s\S]*?)<\/ejecutar>/i;
    const match = content.match(ejecutarRegex);

    if (!match) {
        return null;
    }

    try {
        const instructionsJson = match[1].trim();
        const instructions = JSON.parse(instructionsJson);

        if (!Array.isArray(instructions)) {
            return null;
        }

        // Validate instructions format
        const validInstructions = instructions.filter(inst => {
            return inst && 
                   typeof inst === 'object' && 
                   inst.requestName && 
                   typeof inst.requestName === 'string';
        });

        return validInstructions.length > 0 ? validInstructions : null;
    } catch (error) {
        console.error('Error parsing execution instructions:', error);
        return null;
    }
};

/**
 * Removes execution instructions from message content for display
 * @param {string} content - Message content
 * @returns {string} Content without execution instructions
 */
export const removeExecutionInstructions = (content) => {
    if (!content || typeof content !== 'string') {
        return content;
    }

    return content.replace(/<ejecutar>[\s\S]*?<\/ejecutar>/gi, '').trim();
};

