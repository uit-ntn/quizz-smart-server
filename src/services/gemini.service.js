const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
            this.genAI = null;
            this.model = null;
        } else {
            try {
                this.genAI = new GoogleGenerativeAI(this.apiKey);
                this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
            } catch (error) {
                console.error('❌ Failed to initialize Gemini AI:', error);
                this.genAI = null;
                this.model = null;
            }
        }
    }

    // Generate vocabulary list based on user prompt
    async generateVocabulary({ topic, category, description, count = 10 }) {
        try {
            if (!this.apiKey || !this.model) {
                console.warn('⚠️ Gemini API not available, returning fallback vocabulary');
                return this.getFallbackVocabulary(topic, count);
            }

            console.log(`🤖 Generating ${count} vocabulary words for topic: ${topic}`);

            // Create detailed prompt for Gemini
            const prompt = this.createVocabularyPrompt(topic, category, description, count);

            // Call Gemini API
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log('📝 Raw Gemini response received');

            // Parse and validate JSON response
            const vocabularyList = this.parseVocabularyResponse(text);

            console.log(`✅ Generated ${vocabularyList.length} vocabulary words`);
            return vocabularyList;

        } catch (error) {
            console.error('❌ Gemini API error:', error);
            console.warn('🔄 Falling back to default vocabulary due to API error');
            return this.getFallbackVocabulary(topic, count);
        }
    }

    // Create optimized prompt for vocabulary generation
    createVocabularyPrompt(topic, category, description, count) {
        const prompt = `
You are an English vocabulary teacher. Generate exactly ${count} English vocabulary words related to the topic "${topic}".

**Requirements:**
- Topic: ${topic}
- Category: ${category || 'General'}
- Description: ${description || 'Common vocabulary words'}
- Generate exactly ${count} words
- Include common and useful words for English learners
- Provide accurate Vietnamese meanings
- Create natural example sentences

**Output Format (JSON only, no additional text):**
[
  {
    "word": "example",
    "meaning": "ví dụ",
    "example_sentence": "This is an example of how to use the word in a sentence."
  }
]

**Important Instructions:**
1. Return ONLY valid JSON array format
2. Each word must have: word, meaning (in Vietnamese), example_sentence (in English)
3. Example sentences should be natural and demonstrate correct usage
4. Vietnamese meanings should be accurate and commonly used
5. Words should be appropriate level for English learners
6. NO additional text, explanations, or markdown formatting
7. Ensure JSON is properly formatted and parseable

Generate vocabulary for: ${topic} (${category})`;

        return prompt;
    }

    // Parse and validate Gemini response
    parseVocabularyResponse(text) {
        try {
            // Clean up the response text
            let cleanText = text.trim();
            
            // Remove markdown code blocks if present
            cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            // Remove any leading/trailing text that isn't JSON
            const jsonStart = cleanText.indexOf('[');
            const jsonEnd = cleanText.lastIndexOf(']');
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('No valid JSON array found in response');
            }
            
            cleanText = cleanText.substring(jsonStart, jsonEnd + 1);

            // Parse JSON
            const vocabulary = JSON.parse(cleanText);

            // Validate structure
            if (!Array.isArray(vocabulary)) {
                throw new Error('Response is not an array');
            }

            // Validate each vocabulary item
            const validatedVocabulary = vocabulary.map((item, index) => {
                if (!item.word || !item.meaning || !item.example_sentence) {
                    throw new Error(`Invalid vocabulary item at index ${index}: missing required fields`);
                }

                return {
                    word: item.word.trim(),
                    meaning: item.meaning.trim(),
                    example_sentence: item.example_sentence.trim()
                };
            });

            return validatedVocabulary;

        } catch (error) {
            console.error('❌ Failed to parse vocabulary response:', error);
            console.error('📝 Raw response:', text);
            
            // Return fallback vocabulary if parsing fails
            return this.getFallbackVocabulary("General", 3);
        }
    }

    // Fallback vocabulary for when API fails
    getFallbackVocabulary(topic = "General", count = 3) {
        const fallbackWords = [
            {
                word: "example",
                meaning: "ví dụ",
                example_sentence: "This is an example of how to use the word."
            },
            {
                word: "learning",
                meaning: "học tập",
                example_sentence: "Learning new vocabulary is important for language development."
            },
            {
                word: "practice",
                meaning: "thực hành",
                example_sentence: "You need to practice speaking English every day."
            },
            {
                word: "important",
                meaning: "quan trọng",
                example_sentence: "It's important to understand the context of new words."
            },
            {
                word: "understand",
                meaning: "hiểu",
                example_sentence: "I understand the meaning of this vocabulary word."
            },
            {
                word: "vocabulary",
                meaning: "từ vựng",
                example_sentence: "Building vocabulary is essential for language learning."
            },
            {
                word: "language",
                meaning: "ngôn ngữ",
                example_sentence: "English is a global language used in many countries."
            },
            {
                word: "study",
                meaning: "học tập, nghiên cứu",
                example_sentence: "I study English vocabulary every day to improve my skills."
            },
            {
                word: "improve",
                meaning: "cải thiện",
                example_sentence: "Regular practice will help improve your English skills."
            },
            {
                word: "communication",
                meaning: "giao tiếp",
                example_sentence: "Good communication skills are valuable in any profession."
            }
        ];

        // Return requested number of words or available words, whichever is smaller
        const requestedCount = Math.min(count, fallbackWords.length);
        const selectedWords = fallbackWords.slice(0, requestedCount);

        // Add topic-specific context to the first word if topic is provided
        if (topic && topic !== "General" && selectedWords.length > 0) {
            selectedWords[0] = {
                ...selectedWords[0],
                word: selectedWords[0].word,
                meaning: selectedWords[0].meaning,
                example_sentence: `This is a ${topic.toLowerCase()}-related example: ${selectedWords[0].example_sentence}`
            };
        }

        return selectedWords;
    }

    // Test API connection
    async testConnection() {
        try {
            if (!this.apiKey) {
                throw new Error('API key not configured');
            }

            const result = await this.model.generateContent('Say "Hello, API is working!"');
            const response = await result.response;
            const text = response.text();
            
            console.log('✅ Gemini API connection successful:', text);
            return { success: true, message: text };

        } catch (error) {
            console.error('❌ Gemini API connection failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get usage statistics (for monitoring)
    getUsageInfo() {
        return {
            apiKey: this.apiKey ? 'Configured' : 'Not Configured',
            service: 'Google Generative AI',
            status: this.apiKey ? 'Ready' : 'Needs Configuration'
        };
    }
}

// Create singleton instance
const geminiService = new GeminiService();

module.exports = geminiService;
