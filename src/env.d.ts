declare global {
    namespace NodeJS {
        interface ProcessEnv {
            ENCRYPTION_ALGO: string;
            ENCRYPTION_SALT: string;
            WEB3_STORAGE_API_KEY: string;
        }
    }
}
