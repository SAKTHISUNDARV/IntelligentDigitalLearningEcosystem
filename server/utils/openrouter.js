const axios = require('axios');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const DEFAULT_FREE_MODELS = [
    'openrouter/free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'qwen/qwen3-4b:free',
    'stepfun/step-3.5-flash:free'
];

function normalizeMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    const systemMessages = [];
    const otherMessages = [];

    for (const message of messages) {
        if (!message || !message.content) continue;
        if (message.role === 'system') {
            systemMessages.push(String(message.content));
            continue;
        }
        otherMessages.push({
            role: message.role || 'user',
            content: String(message.content)
        });
    }

    if (!systemMessages.length) {
        return otherMessages;
    }

    const combinedInstructions = `System instructions:\n${systemMessages.join('\n\n')}`;
    if (otherMessages.length === 0) {
        return [{ role: 'user', content: combinedInstructions }];
    }

    const [firstMessage, ...rest] = otherMessages;
    return [
        {
            ...firstMessage,
            content: `${combinedInstructions}\n\n${firstMessage.content}`
        },
        ...rest
    ];
}

function resolveModels(models) {
    const configuredModels = process.env.OPENROUTER_MODELS
        ? process.env.OPENROUTER_MODELS.split(',').map(model => model.trim()).filter(Boolean)
        : [];

    const selectedModels = Array.isArray(models) && models.length > 0
        ? [...models, ...configuredModels, ...DEFAULT_FREE_MODELS]
        : configuredModels.length > 0
            ? [...configuredModels, ...DEFAULT_FREE_MODELS]
            : DEFAULT_FREE_MODELS;

    return [...new Set(selectedModels.map(model => String(model).trim()).filter(Boolean))];
}

async function createChatCompletion({
    apiKey,
    messages,
    temperature = 0.6,
    maxTokens,
    referer,
    title = 'IDLE Learning Platform',
    models,
    timeout = 45000
}) {
    if (!apiKey) {
        throw new Error('OpenRouter API key not configured');
    }

    const candidateModels = resolveModels(models);
    const normalizedMessages = normalizeMessages(messages);
    if (candidateModels.length === 0) {
        throw new Error('No OpenRouter models configured');
    }

    let lastError = 'No models available';
    const failures = [];

    for (const model of candidateModels) {
        try {
            const response = await axios.post(
                OPENROUTER_URL,
                {
                    model,
                    messages: normalizedMessages,
                    temperature,
                    ...(maxTokens ? { max_tokens: maxTokens } : {})
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': referer || 'http://localhost:5173',
                        'X-Title': title
                    },
                    timeout
                }
            );

            return response.data;
        } catch (err) {
            lastError = err.response?.data?.error?.message || err.message;
            failures.push(`${model}: ${lastError}`);
            console.warn(`[OpenRouter] ${model} failed: ${lastError}`);
        }
    }

    const failure = new Error(`AI service error: ${failures.join(' | ') || lastError}`);
    failure.status = 502;
    failure.detail = failures.join(' | ') || lastError;
    throw failure;
}

async function streamChatCompletion({
    apiKey,
    messages,
    temperature = 0.6,
    maxTokens,
    referer,
    title = 'IDLE Learning Platform',
    models,
    timeout = 45000
}) {
    if (!apiKey) {
        throw new Error('OpenRouter API key not configured');
    }

    const candidateModels = resolveModels(models);
    const normalizedMessages = normalizeMessages(messages);
    if (candidateModels.length === 0) {
        throw new Error('No OpenRouter models configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const failures = [];

    try {
        for (const model of candidateModels) {
            try {
                const response = await fetch(OPENROUTER_URL, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': referer || 'http://localhost:5173',
                        'X-Title': title
                    },
                    body: JSON.stringify({
                        model,
                        messages: normalizedMessages,
                        temperature,
                        stream: true,
                        ...(maxTokens ? { max_tokens: maxTokens } : {})
                    }),
                    signal: controller.signal
                });

                if (!response.ok || !response.body) {
                    const errorText = await response.text();
                    const message = errorText || `Streaming request failed with status ${response.status}`;
                    failures.push(`${model}: ${message}`);
                    console.warn(`[OpenRouter Stream] ${model} failed: ${message}`);
                    continue;
                }

                return { model, stream: response.body };
            } catch (err) {
                const message = err.name === 'AbortError' ? 'Streaming request timed out' : err.message;
                failures.push(`${model}: ${message}`);
                console.warn(`[OpenRouter Stream] ${model} failed: ${message}`);
            }
        }
    } finally {
        clearTimeout(timeoutId);
    }

    const failure = new Error(`AI service error: ${failures.join(' | ') || 'No models available'}`);
    failure.status = 502;
    failure.detail = failures.join(' | ') || 'No models available';
    throw failure;
}

module.exports = {
    DEFAULT_FREE_MODELS,
    normalizeMessages,
    resolveModels,
    createChatCompletion,
    streamChatCompletion
};
