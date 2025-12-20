
export class ApiKeyManager {
    private keys: string[] = [];
    private currentKeyIndex: number = 0;

    constructor() {
        // Load keys from environment variables
        const key0 = process.env.GEMINI_API_KEY || process.env.API_KEY;
        // const key1 = process.env.GEMINI_API_KEY1;
        // const key2 = process.env.GEMINI_API_KEY2;
        // const key3 = process.env.GEMINI_API_KEY3;
        // const key4 = process.env.GEMINI_API_KEY4;


        if (key0) this.keys.push(key0);
        // if (key1) this.keys.push(key1);
        // if (key2) this.keys.push(key2);
        // if (key3) this.keys.push(key3);
        // if (key4) this.keys.push(key4);

        if (this.keys.length === 0) {
            console.warn("ApiKeyManager: No API keys found in environment variables.");
        } else {
            console.log(`ApiKeyManager: Loaded ${this.keys.length} API keys.`);
        }
    }

    public getCurrentKey(): string | undefined {
        if (this.keys.length === 0) return undefined;
        return this.keys[this.currentKeyIndex];
    }

    public rotateKey(): string | undefined {
        if (this.keys.length <= 1) {
            console.warn("ApiKeyManager: Only one key available, cannot rotate.");
            return this.getCurrentKey();
        }

        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
        console.log(`ApiKeyManager: Rotated to key index ${this.currentKeyIndex}`);
        return this.getCurrentKey();
    }

    public getKeysCount(): number {
        return this.keys.length;
    }
}

export const apiKeyManager = new ApiKeyManager();
